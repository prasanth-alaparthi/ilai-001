package com.muse.notes.labs.repository;

import com.muse.notes.labs.entity.Lab;
import com.muse.notes.labs.entity.LabCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabRepository extends JpaRepository<Lab, Long> {
    List<Lab> findByCategory(LabCategory category);
}
