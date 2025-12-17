package com.muse.academic.academic.repository;

import com.muse.academic.academic.entity.ClassMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClassMemberRepository extends JpaRepository<ClassMember, Long> {
    List<ClassMember> findByStudentId(Long studentId);

    List<ClassMember> findByClassroomId(Long classroomId);
}
