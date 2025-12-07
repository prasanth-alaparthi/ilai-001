package com.muse.notes.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Entity
@Table(name = "note_links")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@IdClass(NoteLink.NoteLinkId.class)
public class NoteLink {

    @Id
    @Column(name = "source_note_id")
    private Long sourceNoteId;

    @Id
    @Column(name = "linked_note_id")
    private Long linkedNoteId;

    @Column(name = "relevance_score")
    private Float relevanceScore;

    public static class NoteLinkId implements Serializable {
        private Long sourceNoteId;
        private Long linkedNoteId;
    }
}
