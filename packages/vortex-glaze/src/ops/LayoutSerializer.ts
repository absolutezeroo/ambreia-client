import {WindowParser} from '@ambreia/ui/utils/WindowParser';
import type {ILayoutSerializerState} from '../state/EditorStateContracts';

/**
 * Layout persistence for the editor.
 *
 * Structure + attributes come from the engine's own AS3-faithful serializer
 * `WindowParser.windowToXMLString` (walking the live window tree); the source
 * `<variables>` blocks — which the live tree faithfully discards — are re-injected
 * per named node from the {@link VariablesModel}, replacing any block the engine
 * serializer emitted for that node.
 *
 * Round-trip caveat (R1): what comes back is only ever as complete as the live
 * tree. `serializeChildren` now walks the layout child target (matching AS3's
 * `IIterable.get iterator`), so frames, tab contexts and scrollable lists keep
 * their content — that fix alone restored 249 of the 805 shipped layouts. What
 * it cannot restore is a layout whose tree never built its children in the first
 * place (`furni_view`: 68 source elements, one live window); those save as the
 * stub they actually are.
 */
export function serializeLayout(state: ILayoutSerializerState): string
{
    const root = state.rootWindow;

    if(!root || root.disposed)
    {
        return '';
    }

    const parser = new WindowParser(root.context);
    const xml = parser.windowToXMLString(root);

    return wrapInLayoutDocument(state, injectVariables(xml, state));
}

/**
 * Wraps the serialized window in the `<layout><window>…</window></layout>`
 * document the client's own parser reads.
 *
 * `windowToXMLString` returns the window element alone — saving that verbatim
 * produced a file whose root was a bare `<border>`/`<container>`, which
 * `parseWindowLayoutXml` rejects outright (it takes a `<layout>` or a `<window>`
 * root and returns nothing otherwise). Every layout Glaze saved was therefore
 * unreadable, and reopening one silently fell back to the bundled original.
 *
 * The open layout's source document supplies the envelope, so its attributes and
 * any non-`<window>` blocks it carries (`<sharedvariables>`) survive the
 * round-trip; only the declared size follows the edited root.
 */
function wrapInLayoutDocument(state: ILayoutSerializerState, windowXml: string): string
{
    const root = state.rootWindow;

    if(!windowXml || !root)
    {
        return windowXml;
    }

    const parsed = new DOMParser().parseFromString(windowXml, 'text/xml');

    if(parsed.getElementsByTagName('parsererror').length > 0 || !parsed.documentElement)
    {
        return windowXml;
    }

    const name = state.currentLayoutName ?? 'layout';
    const source = state.currentLayoutName ? state.runtime.layoutXml.get(state.currentLayoutName) : null;
    const doc = document.implementation.createDocument('', 'layout', null);
    const layoutRoot = doc.documentElement;

    if(source)
    {
        const sourceDoc = new DOMParser().parseFromString(source, 'text/xml');
        const sourceRoot = sourceDoc.documentElement;

        if(sourceRoot && sourceRoot.nodeName === 'layout' && sourceDoc.getElementsByTagName('parsererror').length === 0)
        {
            for(let i = 0; i < sourceRoot.attributes.length; i++)
            {
                const attribute = sourceRoot.attributes.item(i);

                if(attribute)
                {
                    layoutRoot.setAttribute(attribute.name, attribute.value);
                }
            }

            for(const child of Array.from(sourceRoot.children))
            {
                if(child.nodeName !== 'window')
                {
                    layoutRoot.appendChild(doc.importNode(child, true));
                }
            }
        }
    }

    if(!layoutRoot.getAttribute('name'))
    {
        layoutRoot.setAttribute('name', name);
    }

    layoutRoot.setAttribute('width', String(root.width));
    layoutRoot.setAttribute('height', String(root.height));

    // The editor centres the root on the canvas; the file keeps where it was authored.
    parsed.documentElement.setAttribute('x', String(state.rootOrigin.x));
    parsed.documentElement.setAttribute('y', String(state.rootOrigin.y));

    const windowElement = doc.createElement('window');

    windowElement.appendChild(doc.importNode(parsed.documentElement, true));
    layoutRoot.appendChild(windowElement);

    return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(layoutRoot)}`;
}

function injectVariables(xml: string, state: ILayoutSerializerState): string
{
    const model = state.variables;

    if(!model)
    {
        return xml;
    }

    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    if(doc.getElementsByTagName('parsererror').length > 0 || !doc.documentElement)
    {
        return xml;
    }

    const visit = (el: Element): void =>
    {
        const name = el.getAttribute('name');

        if(name)
        {
            const block = model.emit(name, doc);

            if(block)
            {
                // The model wins over anything the engine serializer emitted for
                // this node: it is seeded from the source XML and carries the
                // editor's `<var>` edits, while `windowToXMLString` can only see
                // the properties a controller happens to keep (the base class
                // keeps none), which would silently drop an edit.
                const existing = directChild(el, 'variables');

                if(existing)
                {
                    el.removeChild(existing);
                }

                el.appendChild(block);
            }
        }

        for(const child of Array.from(el.children))
        {
            visit(child);
        }
    };

    visit(doc.documentElement);

    return new XMLSerializer().serializeToString(doc);
}

function directChild(element: Element, name: string): Element | null
{
    for(let i = 0; i < element.children.length; i++)
    {
        const child = element.children.item(i);

        if(child && child.nodeName === name)
        {
            return child;
        }
    }

    return null;
}

/** Downloads the current layout as an `.xml` file. */
export function downloadLayout(state: ILayoutSerializerState): void
{
    const xml = serializeLayout(state);

    if(!xml)
    {
        return;
    }

    const name = state.currentLayoutName ?? 'layout';
    const blob = new Blob([xml], {type: 'text/xml'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${name}.xml`;
    a.click();
    URL.revokeObjectURL(url);
}

/** Saves the current layout back to disk via the dev-server middleware. */
export async function saveLayout(state: ILayoutSerializerState): Promise<{ ok: boolean; message: string }>
{
    const xml = serializeLayout(state);
    const name = state.currentLayoutName;

    if(!xml || !name)
    {
        return {ok: false, message: 'Nothing to save'};
    }

    try
    {
        const res = await fetch('/glaze/save', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name, xml})
        });
        const data = (await res.json().catch(() => ({}))) as { message?: string };

        return {ok: res.ok, message: data.message ?? (res.ok ? 'Saved' : `HTTP ${res.status}`)};
    }
    catch (error)
    {
        return {ok: false, message: String(error)};
    }
}

/** Registers raw layout XML under a name and opens it in the editor. */
export function importLayoutXml(state: ILayoutSerializerState, xml: string, name: string): boolean
{
    try
    {
        state.runtime.windowManager.registerWidgetLayout(name, xml);
        state.runtime.layoutXml.set(name, xml);
        state.openLayout(name);

        return true;
    }
    catch
    {
        return false;
    }
}
