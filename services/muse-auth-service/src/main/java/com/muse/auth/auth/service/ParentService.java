package com.muse.auth.auth.service;

import com.muse.auth.auth.entity.User;
import com.muse.auth.auth.enums.Role;
import com.muse.auth.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ParentService {

    private final UserRepository userRepository;

    @Transactional
    public void addChild(String parentUsername, String childIdentifier) {
        User parent = userRepository.findByUsername(parentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Parent not found"));

        if (parent.getRole() != Role.PARENT) {
            throw new IllegalArgumentException("Only parents can add children");
        }

        User child = userRepository.findByUsernameOrEmail(childIdentifier, childIdentifier)
                .orElseThrow(() -> new IllegalArgumentException("Child not found"));

        if (child.getRole() != Role.STUDENT) {
            throw new IllegalArgumentException("Can only add students as children");
        }

        // Check if already added
        if (parent.getChildren().contains(child)) {
            throw new IllegalArgumentException("Child already added");
        }

        parent.getChildren().add(child);
        child.getParents().add(parent);

        userRepository.save(parent);
        userRepository.save(child);
    }

    @Transactional(readOnly = true)
    public Set<User> getChildren(String parentUsername) {
        User parent = userRepository.findByUsername(parentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Parent not found"));

        // Force initialization of children collection if lazy
        parent.getChildren().size();

        return parent.getChildren();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getChildPermissions(String parentUsername, Long childId) {
        User parent = userRepository.findByUsername(parentUsername)
                .orElseThrow(() -> new IllegalArgumentException("Parent not found"));

        User child = userRepository.findById(childId)
                .orElseThrow(() -> new IllegalArgumentException("Child not found"));

        if (!parent.getChildren().contains(child)) {
            throw new IllegalArgumentException("This user is not your child");
        }

        int age = calculateAge(child.getDateOfBirth());
        boolean isUnder13 = age < 13;

        return Map.of(
                "childId", child.getId(),
                "age", age,
                "canMonitorActivity", true,
                "canViewPersonalMessages", isUnder13,
                "canViewVideoChat", isUnder13,
                "canModifyContent", false // Parents can never modify
        );
    }

    private int calculateAge(LocalDate dob) {
        if (dob == null)
            return 0; // Default or handle error
        return Period.between(dob, LocalDate.now()).getYears();
    }
}
