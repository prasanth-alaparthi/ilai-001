import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

export const WikiLinkExtension = Extension.create({
    name: 'wikiLink',

    addOptions() {
        return {
            suggestion: {
                char: '[[',
                command: ({ editor, range, props }) => {
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .setLink({
                            href: `/notes/${props.id}`,
                            class: 'wiki-link font-medium text-primary-500 hover:text-primary-600 underline',
                            'data-note-id': props.id
                        })
                        .insertContent(props.title)
                        .unsetLink() // Stop link from continuing
                        .insertContent(' ')
                        .run();
                },
            },
        };
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});
