package com.muse.labs.repository;

import com.muse.labs.entity.Lab;
import com.muse.labs.entity.LabCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LabRepository extends JpaRepository<Lab, Long> {
    List<Lab> findByCategory(LabCategory category);
}
