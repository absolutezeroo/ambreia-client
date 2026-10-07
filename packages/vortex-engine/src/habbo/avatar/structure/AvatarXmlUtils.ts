/**
 * Small XML helpers for AS3 avatar data ports.
 * These keep TS parsers close to AS3 XML access patterns: @attributes, direct children, and text().
 *
 * The type tests are structural (DOM node types), not `instanceof Document`: Node has no DOM globals,
 * and the documents its parser returns are not the browser's classes.
 */
import {platform} from '@ambreia/common/platform/Platform';

export function isXmlDocument(data: unknown): data is Document
{
    return typeof data === 'object' && data !== null && (data as Node).nodeType === 9;
}

export function isXmlElement(data: unknown): data is Element
{
    return typeof data === 'object' && data !== null && (data as Node).nodeType === 1;
}

export function getXmlRoot(data: unknown): Element | null
{
    if(isXmlDocument(data))
    {
        return data.documentElement;
    }

    if(isXmlElement(data))
    {
        return data;
    }

    return null;
}

export function getXmlAttribute(element: Element, name: string, fallback: string = ''): string
{
    return element.getAttribute(name) ?? fallback;
}

export function getXmlText(element: Element): string
{
    return element.textContent?.trim() ?? '';
}

export function getXmlTagName(element: Element): string
{
    return element.localName || element.tagName;
}

export function getXmlChildElements(element: Element, tagName: string): Element[]
{
    return Array.from(element.children).filter((child) => getXmlTagName(child) === tagName);
}

export function getXmlFirstChildElement(element: Element, tagName: string): Element | null
{
    return getXmlChildElements(element, tagName)[0] ?? null;
}

export function getXmlDescendants(element: Element, tagName: string): Element[]
{
    return Array.from(element.getElementsByTagName(tagName));
}

export function parseXmlDocument(text: string): Document | null
{
    const document = platform().parseXml(text);

    if(document.getElementsByTagName('parsererror').length > 0)
    {
        return null;
    }

    return document;
}