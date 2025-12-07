package com.muse.academic.repository;

import com.muse.academic.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    List<Complaint> findByInstitutionId(Long institutionId);

    List<Complaint> findByReporterId(Long reporterId);
}
