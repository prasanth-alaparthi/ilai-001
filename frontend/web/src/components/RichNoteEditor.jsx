import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from '@tiptap/extension-font-family';
import { FontSize } from './editor/extensions/FontSize';
import apiClient from "../services/apiClient";
import AiMenu from "./AiMenu";
import BubbleMenuComponent from "./editor/BubbleMenu";
import FloatingMenuComponent from "./editor/FloatingMenu";
import { SlashCommandExtension } from './editor/SlashCommandExtension';
import { getSuggestionItems } from './editor/suggestion-items';
import slashCommand from './editor/slash-command.js';
import RibbonToolbar from "./editor/RibbonToolbar";

export default function RichNoteEditor({ value, onChange, noteId, onRestore, onEditorReady }) {
	const onChangeRef = React.useRef(onChange);
	const valueRef = React.useRef(value); // Track latest value prop
	const prevNoteIdRef = React.useRef(noteId); // Track previous noteId to detect changes

	useEffect(() => {
		onChangeRef.current = onChange;
	}, [onChange]);

	// Keep valueRef updated
	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	const editor = useEditor({
		extensions: [
			Color.configure({ types: ["textStyle"] }),
			TextStyle,
			FontFamily,
			FontSize,
			StarterKit.configure({
				heading: {
					levels: [1, 2, 3],
				},
			}),
			SlashCommandExtension.configure({
				suggestion: {
					items: getSuggestionItems,
					render: slashCommand,
				},
			}),
			Underline,
			Link.configure({
				openOnClick: true,
				HTMLAttributes: {
					class: 'text-primary-500 hover:underline cursor-pointer',
				},
			}),
			TaskList,
			TaskItem.configure({
				nested: true,
			}),
			Placeholder.configure({
				placeholder: "Type '/' for commands or just start writing...",
				emptyEditorClass: 'is-editor-empty before:content-[attr(data-placeholder)] before:text-surface-400 before:float-left before:pointer-events-none',
			}),
			Image.configure({
				inline: false,
				HTMLAttributes: {
					class: 'rounded-xl shadow-lg max-w-full',
				},
			}),
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			Highlight.configure({
				multicolor: true,
			}),
		],
		content: value || "",
		onUpdate: ({ editor }) => {
			console.log("[DEBUG] RichNoteEditor onUpdate fired, onChangeRef.current:", !!onChangeRef.current);
			if (onChangeRef.current) {
				onChangeRef.current(editor.getJSON());
			}
		},
		editorProps: {
			attributes: {
				class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[50vh]',
			},
			handleDrop: (view, event, slice, moved) => {
				if (moved) {
					return false;
				}
				if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
					const files = Array.from(event.dataTransfer.files);
					const { schema } = view.state;
					const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });

					files.forEach(async (file) => {
						const formData = new FormData();
						formData.append("file", file);
						try {
							const response = await apiClient.post(
								"/notes/attachments/upload",
								formData,
								{
									headers: {
										"Content-Type": "multipart/form-data",
									},
								}
							);
							const uploadResult = response.data;
							if (uploadResult && uploadResult.id) {
								const { tr } = view.state;
								let node;
								if (file.type.startsWith('image/')) {
									const imageUrl = `/api/notes/attachments/${uploadResult.id}`;
									node = schema.nodes.image.create({ src: imageUrl });
								} else {
									const fileUrl = `/api/notes/attachments/${uploadResult.id}`;
									const safeName = file.name.replace(/"/g, "");
									const link = schema.text(safeName, [schema.marks.link.create({ href: fileUrl, download: safeName })]);
									node = schema.nodes.paragraph.create({}, link);
								}
								const transaction = tr.insert(pos.pos, node);
								view.dispatch(transaction);
							}
						} catch (error) {
							console.error("Error uploading file:", error);
						}
					});

					return true;
				}
				return false;
			},
		},
	}, []);

	useEffect(() => {
		if (editor && onEditorReady) {
			onEditorReady(editor);
		}
	}, [editor, onEditorReady]);

	// Set initial content when noteId changes (loading a new note)
	// Don't re-sync on every value change - that would interrupt user typing
	useEffect(() => {
		if (!editor) return;

		// Check if noteId actually changed
		if (prevNoteIdRef.current !== noteId) {
			console.log("[DEBUG] Note changed from", prevNoteIdRef.current, "to", noteId);
			prevNoteIdRef.current = noteId;

			// Use the current value prop (not valueRef, since we want the fresh prop)
			if (value) {
				console.log("[DEBUG] Setting editor content for new note:", noteId);
				editor.commands.setContent(value, false);
			} else {
				console.log("[DEBUG] Clearing editor - no content for note:", noteId);
				editor.commands.clearContent();
			}
		}
	}, [noteId, value, editor]);

	if (!editor) {
		return (
			<div className="flex-1 flex items-center justify-center text-sm text-surface-500 animate-pulse">
				Loading editor...
			</div>
		);
	}

	return (
		<div className="flex flex-col h-full bg-transparent">
			<RibbonToolbar editor={editor} />

			<BubbleMenuComponent editor={editor} />
			<FloatingMenuComponent editor={editor} />

			<EditorContent editor={editor} className="flex-1 overflow-y-auto p-8 sm:p-12" />
		</div>
	);
}
