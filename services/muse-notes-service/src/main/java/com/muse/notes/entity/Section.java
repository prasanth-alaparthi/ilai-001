package com.muse.notes.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sections")
@Data
public class Section {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "notebook_id", nullable = false)
    @JsonBackReference("notebook-sections")
    private Notebook notebook;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @Column(name = "order_index")
    private Integer orderIndex;

    // Self-referencing for nested sections/folders
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonBackReference("section-parent")
    private Section parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("section-parent")
    @OrderBy("orderIndex ASC")
    private List<Section> children = new ArrayList<>();

    @OneToMany(mappedBy = "section", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("section-notes")
    private List<Note> notes = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "section_notes_mapping", joinColumns = @JoinColumn(name = "section_id"), inverseJoinColumns = @JoinColumn(name = "note_id"))
    private List<Note> sharedNotes = new ArrayList<>();

    // Helper to get the nesting level (0 = root, 1 = first level, etc.)
    @Transient
    public int getLevel() {
        int level = 0;
        Section current = this.parent;
        while (current != null) {
            level++;
            current = current.getParent();
        }
        return level;
    }

    // Helper to check if this is a root section
    @Transient
    public boolean isRoot() {
        return this.parent == null;
    }
}
