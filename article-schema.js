import {Schema} from "prosemirror-model";
import {marks as basicMakrs} from 'prosemirror-schema-basic';
import normalizeColor from 'normalize-css-color';
import {tableNodes} from "prosemirror-tables";

const nodes = {
    doc: {
        content: 'block+'
    },

    text: {
        inline: true,
        group: 'inline'
    },

    hardBreak: {
        inline: true,
        group: 'inline',
        selectable: false,
        toDOM: () => ['br'],
        parseDOM: [{tag: 'br'}]
    },

    paragraph: {
        content: 'inline*',
        group: 'block',
        attrs: {
            align: {default: 'left'}
        },
        toDOM: (node) => [
            'p',
            {
                style: `text-align: ${node.attrs.align}`
            },
            0
        ],
        parseDOM: [
            {
                tag: 'p',
                getAttrs: (dom) => ({
                    align: dom.style.textAlign.match(/^(left|center|right)$/) ? dom.style.textAlign : 'left'
                })
            }
        ]
    },

    image: {
        group: 'block',
        atom: true,
        attrs: {
            src: {},
            desc: {default: null}
        },
        toDOM: (node) => [
            'img',
            {
                src: node.attrs.src,
                alt: node.attrs.desc
            }
        ],
        parseDOM: [
            {
                tag: 'img',
                getAttrs: (dom) => ({
                    src: dom.getAttribute('src'),
                    desc: dom.getAttribute('alt')
                })
            }
        ]
    },

    video: {
        group: 'block',
        atom: true,
        attrs: {
            source: {},
            source_id: {},
            url: {},
            title: {},
            thumbnail: {}
        },
        toDOM: (node) => [
            'div',
            {
                'data-node': 'video',
                'data-source': node.attrs.source,
                'data-source-id': node.attrs.source_id,
                'data-url': node.attrs.url,
                'data-title': node.attrs.title,
                'data-thumbnail': node.attrs.thumbnail
            }
        ],
        parseDOM: [
            {
                tag: 'div[data-node=video]',
                getAttrs: (dom) => ({
                    source: dom.getAttribute('data-source'),
                    source_id: dom.getAttribute('data-source-id'),
                    url: dom.getAttribute('data-url'),
                    title: dom.getAttribute('data-title'),
                    thumbnail: dom.getAttribute('data-thumbnail')
                })
            }
        ]
    },

    quote: {
        content: '(text|hardBreak)+',
        marks: '',
        group: 'block',
        toDOM: () => ['blockquote', 0],
        parseDOM: [{tag: 'blockquote'}]
    },

    borderline: {
        attrs: {
            style: {default: '1'}
        },
        group: 'block',
        toDOM: (node) => ['hr', {'data-style': node.attrs.style}],
        parseDOM: [
            {
                tag: 'hr',
                getAttrs: (dom) => {
                    const styleFromDom = dom.getAttribute('data-style');
                    const style = styleFromDom ? styleFromDom.match(/^(1|2|3|4)$/) ? styleFromDom : '1' : '1';

                    return {
                        style
                    }
                }
            }
        ]
    },

    headline: {
        content: '(text|hardBreak)+',
        marks: '',
        group: 'block',
        toDOM: () => ['h2', 0],
        parseDOM: [{tag: 'h2'}]
    },

    ...(tableNodes({
        tableGroup: "block",
        cellContent: "paragraph+",
        cellAttributes: {
            background: {
                default: null,
                getFromDOM(dom) {
                    return dom.style.backgroundColor || null
                },
                setDOMAttr(value, attrs) {
                    if (value) attrs.style = (attrs.style || "") + `background-color: ${value};`
                }
            }
        }
    })),
};

const marks = {
    ...basicMakrs,
    fontSize: {
        attrs: {
            size: {default: 3}
        },
        toDOM: (node) => [
            'span',
            {
                style: (function () {
                    let fontSize;

                    switch (node.attrs.size) {
                        case 1:
                            fontSize = '60%';
                            break;
                        case 2:
                            fontSize = '80%';
                            break;
                        case 4:
                            fontSize = '120%';
                            break;
                        case 5:
                            fontSize = '140%';
                            break;
                        default:
                            fontSize = '100%';
                    }

                    return `font-size: ${fontSize}`;
                })()
            }
        ],
        parseDOM: [
            {
                style: 'font-size',
                getAttrs: (value) => {
                    let size;

                    switch (value) {
                        case '60%':
                            size = 1;
                            break;
                        case '80%':
                            size = 2;
                            break;
                        case '120%':
                            size = 4;
                            break;
                        case '140%':
                            size = 5;
                            break;
                        default:
                            size = 3;
                    }

                    return {
                        size
                    };
                }

            }
        ]
    },

    color: {
        attrs: {
            color: {default: 'black'}
        },
        toDOM: (node) => [
            'span',
            {
                style: `color: ${node.attrs.color}`
            }
        ],
        parseDOM: [
            {
                style: 'color',
                getAttrs: (value) => ({
                    color: colorToHex(value)
                })
            },
            {
                tag: 'font[color]',
                getAttrs: (dom) => ({
                    color: colorToHex(dom.getAttribute('color'))
                })
            }
        ]
    },

    underline: {
        toDOM: () => [
            'span',
            {
                style: 'text-decoration: underline'
            }
        ],
        parseDOM: [
            {style: 'text-decoration=underline'},
            {tag: 'u'}
        ]
    },
};

delete marks.code;
delete marks.link;
delete marks.em;

// 색상과 크기는 스펙 아웃
delete marks.fontSize;
delete marks.color;

function colorToHex(color) {
    const colorValue = normalizeColor(color);
    let hex = colorValue.toString(16);
    const pad = 8 - hex.length;

    for (let i = 0; i < pad; i++) {
        hex = '0' + hex;
    }

    return '#' + hex.slice(0, 6);
}

export const schema = new Schema({nodes, marks});
