import {
    LuHeading1,
    LuHeading2,
    LuList,
    LuListOrdered,
    LuQuote,
    LuCode,
} from 'react-icons/lu';

export const getSuggestionItems = ({ query }) => {
    return [
        {
            title: 'Heading 1',
            icon: LuHeading1,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode('heading', { level: 1 })
                    .run();
            },
        },
        {
            title: 'Heading 2',
            icon: LuHeading2,
            command: ({ editor, range }) => {
                editor
                    .chain()
                    .focus()
                    .deleteRange(range)
                    .setNode('heading', { level: 2 })
                    .run();
            },
        },
        {
            title: 'Bullet List',
            icon: LuList,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBulletList().run();
            },
        },
        {
            title: 'Ordered List',
            icon: LuListOrdered,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleOrderedList().run();
            },
        },
        {
            title: 'Blockquote',
            icon: LuQuote,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleBlockquote().run();
            },
        },
        {
            title: 'Code Block',
            icon: LuCode,
            command: ({ editor, range }) => {
                editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
            },
        },
    ]
        .filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase()))
        .slice(0, 10);
};
