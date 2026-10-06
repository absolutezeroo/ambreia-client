import {Logger} from '@core/utils/Logger';
import type {IWindow} from '@core/window/IWindow';
import type {IWindowContainer} from '@core/window/IWindowContainer';
import type {IItemListWindow} from '@core/window/components/IItemListWindow';
import type {ITabContextWindow} from '@core/window/components/ITabContextWindow';
import type {HabboCatalog} from '../HabboCatalog';
import type {IHabboCatalog} from '../IHabboCatalog';
import type {NodeData} from '../../communication/messages/incoming/catalog/NodeData';
import {CatalogEvent} from '../event/CatalogEvent';
import {CatalogPageOpenedEvent} from './events/CatalogPageOpenedEvent';
import {TopViewSelector} from '../TopViewSelector';
import type {ICatalogNavigator} from './ICatalogNavigator';
import type {ICatalogNode} from './ICatalogNode';
import {CatalogNode} from './CatalogNode';
import {CatalogNodeRenderable} from './CatalogNodeRenderable';

const log = Logger.getLogger('habbo.catalog.navigation.CatalogNavigator');

/**
 * The catalog category tree + navigation window (one per catalog type, e.g. "NORMAL").
 *
 * @see sources/win63_version/habbo/catalog/navigation/CatalogNavigator.as
 */
export class CatalogNavigator implements ICatalogNavigator
{
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::DUMMY_PAGE_ID_FOR_OFFER_SEARCH
    static readonly DUMMY_PAGE_ID_FOR_OFFER_SEARCH: number = -12345678;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::_catalog
    private _catalog: HabboCatalog | null;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::_container
    private _container: IWindowContainer | null;

    private _catalogType: string;

    private _tabs: ITabContextWindow | null = null;

    private _list: IItemListWindow;

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::_index
    private _index: ICatalogNode | null = null;

    private _currentNodes: ICatalogNode[] = [];

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::_offersToNodes
    private _offersToNodes: Map<number, ICatalogNode[]> | null = null;

    private _topItemTemplate: IWindow;

    private _subItemTemplate: IWindow;

    private _listTemplate: IWindow;

    private _topViewSelector: TopViewSelector | null = null;

    constructor(catalog: HabboCatalog, container: IWindowContainer, catalogType: string)
    {
        this._catalog = catalog;
        this._container = container;
        this._catalogType = catalogType;
        this._currentNodes = [];
        this._list = container.findChildByName('navigationList') as unknown as IItemListWindow;
        this._topItemTemplate = this._list.removeListItem(
            this._list.getListItemByName(catalogType.toLowerCase() + '_topitem_template')!
        )!;
        this._subItemTemplate = this._list.removeListItem(
            this._list.getListItemByName(catalogType.toLowerCase() + '_subitem_template')!
        )!;
        this._listTemplate = this._list.removeListItem(
            this._list.getListItemByName(catalogType.toLowerCase() + '_list_template')!
        )!;
        this._tabs = container.findChildByName('tab_context') as unknown as ITabContextWindow | null;

        if(this._tabs != null)
        {
            if(this._catalog.useNonTabbedCatalog(catalogType))
            {
                this._tabs.visible = false;
            }
            else
            {
                this._topViewSelector = new TopViewSelector(this, this._tabs);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::get initialized()
    get initialized(): boolean
    {
        return this._index != null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::dispose()
    dispose(): void
    {
        if(this._index != null)
        {
            this._index.dispose();
        }

        this._index = null;
        this._offersToNodes = null;
        this._currentNodes = [];
        this._catalog = null;
        this._container = null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::buildCatalogIndex()
    buildCatalogIndex(root: NodeData): void
    {
        this._index = null;
        this._offersToNodes = new Map();
        this._index = this.buildIndexNode(root, 0, null);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::showIndex()
    showIndex(): void
    {
        if(this._index == null) return;

        this._list.removeListItems();

        if(this._topViewSelector != null)
        {
            this._topViewSelector.clearTabs();
        }

        for(const child of this._index.children)
        {
            if(child.visible)
            {
                if(this._catalog!.useNonTabbedCatalog(this._catalogType))
                {
                    (child as CatalogNodeRenderable).addToList(this._list);
                }
                else
                {
                    this._topViewSelector!.addTabItem(child);
                }
            }
        }

        if(this._topViewSelector != null)
        {
            this._topViewSelector.selectTabByIndex(0);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::showNodeContent()
    showNodeContent(node: ICatalogNode): void
    {
        if(this._index == null) return;

        this._list.removeListItems();

        if(node == null || !node.visible) return;

        if(node.children.length)
        {
            for(const child of node.children)
            {
                if(child.visible)
                {
                    (child as CatalogNodeRenderable).addToList(this._list);
                }
            }

            const pathToLayout = this.getPathToNodeWithLayout(node);

            if(pathToLayout.length > 0)
            {
                for(let i = 0; i < pathToLayout.length; i++)
                {
                    const pathNode = pathToLayout[i];
                    const isLast = i === pathToLayout.length - 1;

                    if(isLast || this._currentNodes.indexOf(pathNode) === -1)
                    {
                        this.activateNode(pathNode);
                    }
                }
            }
            else
            {
                this.openCatalogPage(node);
            }
        }
        else
        {
            this.openCatalogPage(node);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getPathToNodeWithLayout()
    // The decompiled source assigns/reads a literal `null` where the recursive result variable
    // belongs (`null.length`/`null.unshift`), which throws immediately if that branch is ever
    // taken. Reconstructed with the obvious intended local (the recursive call's own result).
    private getPathToNodeWithLayout(node: ICatalogNode): ICatalogNode[]
    {
        for(const child of node.children)
        {
            if(child.visible)
            {
                if(child.pageId > -1)
                {
                    return [child];
                }

                if(child.isBranch)
                {
                    const nested = this.getPathToNodeWithLayout(child);

                    if(nested.length > 0)
                    {
                        nested.unshift(child);

                        return nested;
                    }
                }
            }
        }

        return [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openCategoryForNode()
    private openCategoryForNode(node: ICatalogNode): ICatalogNode
    {
        let current = node.parent;

        while(current != null && current.parent != null && current.parent.pageName !== 'root')
        {
            current = current.parent;
        }

        if(this._topViewSelector && current!.parent)
        {
            const index = current!.parent.children.indexOf(current!);

            this._topViewSelector.selectTabByIndex(index);
        }

        this.showNodeContent(current!);

        return current!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::get catalog()
    get catalog(): IHabboCatalog
    {
        return this._catalog!;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::activateNode()
    activateNode(node: ICatalogNode): void
    {
        const wasCurrent = this._currentNodes.indexOf(node) >= 0;
        const wasOpen = node.isOpen;
        const kept: ICatalogNode[] = [];

        for(const current of this._currentNodes)
        {
            current.deactivate();

            if(current.depth < node.depth)
            {
                kept.push(current);
            }
            else
            {
                current.close();
            }
        }

        this._currentNodes = kept;
        node.activate();

        if(wasCurrent && wasOpen)
        {
            node.close();
        }
        else
        {
            node.open();
        }

        if(this._currentNodes.indexOf(node) < 0)
        {
            this._currentNodes.push(node);
        }

        if(node.isBranch)
        {
            if(node.parent && node.parent instanceof CatalogNodeRenderable)
            {
                (node.parent as CatalogNodeRenderable).updateChildListHeight();
            }

            let totalOffset = 0;
            let visibleHeight = 0;

            for(let i = 0; i < this._list.numListItems; i++)
            {
                if(this._list.getListItemAt(i)!.visible)
                {
                    visibleHeight += this._list.getListItemAt(i)!.height;
                }
            }

            for(const current of this._currentNodes)
            {
                totalOffset += current.offsetV;
            }

            if(totalOffset - this._list.height > 0)
            {
                this._list.scrollV = totalOffset / visibleHeight;
            }
        }

        if(node.pageId > -1)
        {
            this.openCatalogPage(node);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openCatalogPage()
    private openCatalogPage(node: ICatalogNode): void
    {
        this._catalog!.loadCatalogPage(node.pageId, -1, this._catalogType);
        this._catalog!.events.emit(
            CatalogPageOpenedEvent.CATALOG_PAGE_OPENED,
            new CatalogPageOpenedEvent(node.pageId, node.localization)
        );
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openPage()
    openPage(name: string): void
    {
        const node = this.getNodeByName(name);

        if(node != null && node.visible)
        {
            this._catalog!.loadCatalogPage(node.pageId, -1, this._catalogType);
            this.openNavigatorAtNode(node);
        }
        else
        {
            if(node != null && !node.visible)
            {
                this._catalog!.events.emit(CatalogEvent.CATALOG_INVISIBLE_PAGE_VISITED, new CatalogEvent(CatalogEvent.CATALOG_INVISIBLE_PAGE_VISITED));
            }

            this.loadFrontPage();
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openPageById()
    openPageById(pageId: number, offerId: number): void
    {
        if(!this.initialized)
        {
            this._catalog!.openCatalogPageById(pageId, offerId, this._catalogType);

            return;
        }

        let node: ICatalogNode | null = null;

        if(pageId === CatalogNavigator.DUMMY_PAGE_ID_FOR_OFFER_SEARCH)
        {
            const nodes = this.getNodesByOfferId(offerId, true);

            if(nodes != null)
            {
                // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openPageById()
                // Decompiled as `undefined[0]` - the obvious intended value is the just-computed node list.
                node = nodes[0];
            }
        }
        else
        {
            node = this.getNodeById(pageId);
        }

        if(node != null)
        {
            this._catalog!.loadCatalogPage(node.pageId, offerId, this._catalogType);
            this.openNavigatorAtNode(node);
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openPageByOfferId()
    openPageByOfferId(offerId: number): void
    {
        if(!this.initialized)
        {
            this._catalog!.openCatalogPageById(CatalogNavigator.DUMMY_PAGE_ID_FOR_OFFER_SEARCH, offerId, this._catalogType);

            return;
        }

        const nodes = this.getNodesByOfferId(offerId);

        if(nodes != null)
        {
            const node = nodes[0];

            this._catalog!.loadCatalogPage(node.pageId, offerId, this._catalogType);
            this.openNavigatorAtNode(node);
        }
    }

    /**
     * Narrows the navigator tree to what a search matched.
     *
     * Three inputs, because a page can qualify three different ways: `needle` is the normalised
     * query, `furniLines` the furni lines the results belong to (only ever filled by AS3's Builders
     * Club catalog, which the RPG fork removed, so always empty here), and `pageIds` the
     * pages that actually contain a matching offer — the last is what `HabboCatalog` fills in as it
     * walks the results, and it is why a page whose *name* says nothing still shows up.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::filter()
    filter(needle: string, furniLines: string[], pageIds: Set<number> | null = null): void
    {
        if(this._index === null) return;

        const included = new Set<ICatalogNode>();

        CatalogNavigator.markSearchNodes(needle, furniLines, pageIds, this._index, included);
        this.deactivateCurrentNode();
        this._list.removeListItems();
        this.addSearchNodesToList(this._index, included, 1);
    }

    /**
     * AS3: .../CatalogNavigator.as::markSearchNodes()
     *
     * A node that matches pulls in its whole visible subtree; a node that only *contains* a match
     * is included alone, so the path to a result stays navigable without dragging in its siblings.
     * Returns whether anything below it matched.
     *
     * AS3 wraps the body in a try/catch that logs and returns an uninitialised local — reproduced
     * as a `false`, since that is what the AS3 local holds.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::markSearchNodes()
    private static markSearchNodes(
        needle: string,
        furniLines: string[],
        pageIds: Set<number> | null,
        node: ICatalogNode,
        included: Set<ICatalogNode>
    ): boolean
    {
        try
        {
            if(node.visible && node.pageId > 0
                && CatalogNavigator.isSearchMatch(needle, furniLines, pageIds, node))
            {
                CatalogNavigator.includeVisibleSubtree(node, included);

                return true;
            }

            let matchedBelow = false;

            for(const child of node.children)
            {
                if(CatalogNavigator.markSearchNodes(needle, furniLines, pageIds, child, included))
                {
                    matchedBelow = true;
                }
            }

            if(node.visible && node.pageId > 0 && matchedBelow) included.add(node);

            return matchedBelow;
        }
        catch (error)
        {
            log.warn(`Error when loading nodes by name ${needle}:`, error);

            return false;
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::includeVisibleSubtree()
    private static includeVisibleSubtree(node: ICatalogNode, included: Set<ICatalogNode>): void
    {
        if(node.visible && node.pageId > 0) included.add(node);

        for(const child of node.children) CatalogNavigator.includeVisibleSubtree(child, included);
    }

    /**
     * AS3: .../CatalogNavigator.as::isSearchMatch()
     *
     * The page's name and localisation are joined, lower-cased and stripped of spaces, underscores
     * and hyphens before matching — so "room bundles" finds `room_bundles`. The needle is expected
     * already normalised by the caller.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::isSearchMatch()
    private static isSearchMatch(
        needle: string,
        furniLines: string[],
        pageIds: Set<number> | null,
        node: ICatalogNode
    ): boolean
    {
        if(pageIds !== null && pageIds.has(node.pageId)) return true;

        const haystack = [node.pageName, node.localization].join(' ').toLowerCase()
            .replace(/[\s_-]+/g, '');

        if(haystack.indexOf(needle) > -1) return true;

        for(const furniLine of furniLines)
        {
            if(haystack.indexOf(furniLine) >= 0) return true;
        }

        return false;
    }

    /**
     * AS3: .../CatalogNavigator.as::addSearchNodesToList()
     *
     * Depth only advances through nodes that were kept, so an excluded parent does not indent its
     * surviving children.
     */
    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::addSearchNodesToList()
    private addSearchNodesToList(node: ICatalogNode, included: Set<ICatalogNode>, depth: number): void
    {
        for(const child of node.children)
        {
            if(child.visible && included.has(child))
            {
                (child as CatalogNodeRenderable).addSearchResultToList(this._list, depth + 1);
                this.addSearchNodesToList(child, included, depth + 1);
            }
            else
            {
                this.addSearchNodesToList(child, included, depth);
            }
        }
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::deactivateCurrentNode()
    deactivateCurrentNode(): void
    {
        for(const node of this._currentNodes)
        {
            node.deactivate();
            node.close();
        }

        this._currentNodes = [];
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::openNavigatorAtNode()
    private openNavigatorAtNode(node: ICatalogNode): void
    {
        if(node == null) return;

        this.deactivateCurrentNode();

        let current = node.parent;

        while(current != null && current.parent != null)
        {
            current.open();

            if(this._catalog!.useNonTabbedCatalog(this._catalogType))
            {
                this._currentNodes.push(current);
            }

            current = current.parent;
        }

        if(!this._catalog!.useNonTabbedCatalog(this._catalogType))
        {
            this.openCategoryForNode(node);
        }

        this.activateNode(node);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::loadFrontPage()
    loadFrontPage(): void
    {
        if(this._index == null) return;

        const node = this.getFirstNavigable(this._index);

        if(node == null) return;

        log.debug(`Load front page: ${node.localization}(${node.pageId})`);
        this._catalog!.loadCatalogPage(node.pageId, -1, this._catalogType);
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getFirstNavigable()
    private getFirstNavigable(node: ICatalogNode): ICatalogNode | null
    {
        if(node.visible && node !== this._index) return node;

        for(const child of node.children)
        {
            const found = this.getFirstNavigable(child);

            if(found != null) return found;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::buildIndexNode()
    private buildIndexNode(data: NodeData, depth: number, parent: ICatalogNode | null): ICatalogNode
    {
        const node: ICatalogNode = !data.visible
            ? new CatalogNode(this, data, depth, parent)
            : new CatalogNodeRenderable(this, data, depth, parent);

        for(const offerId of node.offerIds)
        {
            const existing = this._offersToNodes!.get(offerId);

            if(existing)
            {
                existing.push(node);
            }
            else
            {
                this._offersToNodes!.set(offerId, [node]);
            }
        }

        depth++;

        for(const childData of data.children)
        {
            node.addChild(this.buildIndexNode(childData, depth, node));
        }

        return node;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getNodesByOfferId()
    getNodesByOfferId(offerId: number, visibleOnly: boolean = false): ICatalogNode[] | null
    {
        if(this._offersToNodes == null) return null;

        const nodes = this._offersToNodes.get(offerId) ?? [];

        if(visibleOnly)
        {
            const visible = nodes.filter((node) => node.visible);

            return visible.length > 0 ? visible : null;
        }

        return nodes;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getNodeByName()
    getNodeByName(name: string): ICatalogNode | null
    {
        return this._index != null ? this.getFirstNodeByName(name, this._index) : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getOptionalNodeByName()
    getOptionalNodeByName(name: string): ICatalogNode | null
    {
        return this._index ? this.getFirstNodeByName(name, this._index) : null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getNodeById()
    getNodeById(pageId: number, root: ICatalogNode | null = null): ICatalogNode | null
    {
        const searchRoot = root ?? this._index;

        if(searchRoot == null) return null;

        if(searchRoot.pageId === pageId && searchRoot !== this._index)
        {
            return searchRoot;
        }

        for(const child of searchRoot.children)
        {
            const found = this.getNodeById(pageId, child);

            if(found != null) return found;
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getFirstNodeByName()
    private getFirstNodeByName(name: string, root: ICatalogNode): ICatalogNode | null
    {
        try
        {
            if(root.pageName === name && root !== this._index)
            {
                return root;
            }

            for(const child of root.children)
            {
                const found = this.getFirstNodeByName(name, child);

                if(found != null) return found;
            }
        }
        catch (e)
        {
            log.error(`Error when loading node by name ${name}:`, e);
        }

        return null;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::get listTemplate()
    get listTemplate(): IWindow
    {
        return this._listTemplate;
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::get isDeepHierarchy()
    get isDeepHierarchy(): boolean
    {
        return this._catalog!.getBoolean('catalog.deep.hierarchy');
    }

    // AS3: sources/WIN63-202607011411-782849652/src/com/sulake/habbo/catalog/navigation/CatalogNavigator.as::getItemTemplate()
    getItemTemplate(depth: number): IWindow
    {
        if(this.isDeepHierarchy)
        {
            return depth > 2 ? this._subItemTemplate : this._topItemTemplate;
        }

        return depth === 1 ? this._topItemTemplate : this._subItemTemplate;
    }
}
