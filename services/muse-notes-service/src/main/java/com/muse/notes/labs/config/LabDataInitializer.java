package com.muse.notes.labs.config;

import com.muse.notes.labs.entity.Lab;
import com.muse.notes.labs.entity.LabCategory;
import com.muse.notes.labs.repository.LabRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LabDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LabDataInitializer.class);

    private final LabRepository labRepository;

    public LabDataInitializer(LabRepository labRepository) {
        this.labRepository = labRepository;
    }

    @Override
    public void run(String... args) {
        if (labRepository.count() == 0) {
            log.info("Seeding labs data...");
            seedLabs();
            log.info("Labs seeding complete. Total labs: {}", labRepository.count());
        } else {
            log.info("Labs already seeded. Count: {}", labRepository.count());
        }
    }

    private void seedLabs() {
        List<Lab> labs = List.of(
                // Physics Labs
                createLab("Projectile Motion Simulator",
                        "Analyze projectile motion with adjustable launch angle and velocity. Observe trajectory and calculate range.",
                        LabCategory.PHYSICS, "Mechanics", "Easy",
                        "projectile_motion", "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500"),

                createLab("Pendulum Oscillation Lab",
                        "Study simple harmonic motion with a virtual pendulum. Measure period and explore the effect of length.",
                        LabCategory.PHYSICS, "Mechanics", "Easy",
                        "pendulum", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500"),

                createLab("Wave Interference Patterns",
                        "Explore constructive and destructive interference. Visualize wave superposition in real-time.",
                        LabCategory.PHYSICS, "Waves", "Medium",
                        "wave_interference", "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500"),

                createLab("Electric Circuit Builder",
                        "Build and test virtual circuits with resistors, capacitors, and power sources. Measure voltage and current.",
                        LabCategory.PHYSICS, "Electromagnetism", "Medium",
                        "circuits", "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=500"),

                // Chemistry Labs
                createLab("Acid-Base Titration",
                        "Perform a virtual titration experiment. Add base dropwise and observe pH changes with indicator color.",
                        LabCategory.CHEMISTRY, "Analytical Chemistry", "Medium",
                        "titration", "https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?w=500"),

                createLab("Chemical Reaction Simulator",
                        "Visualize synthesis, decomposition, and displacement reactions. Watch atoms rearrange in real-time.",
                        LabCategory.CHEMISTRY, "General Chemistry", "Easy",
                        "reactions", "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=500"),

                createLab("pH Scale Explorer",
                        "Learn about acids, bases, and the pH scale. Test common household substances and see their pH values.",
                        LabCategory.CHEMISTRY, "General Chemistry", "Easy",
                        "ph_scale", "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500"),

                createLab("Molecular Structure Builder",
                        "Build 3D molecular models. Explore bond angles, molecular geometry, and Lewis structures.",
                        LabCategory.CHEMISTRY, "Organic Chemistry", "Hard",
                        "molecules", "https://images.unsplash.com/photo-1628863353691-0071c8c1874c?w=500"),

                // Biology Labs
                createLab("Cell Structure Explorer",
                        "Explore animal and plant cells. Click on organelles to learn about their functions.",
                        LabCategory.BIOLOGY, "Cell Biology", "Easy",
                        "cell_structure", "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=500"),

                createLab("DNA Replication Simulation",
                        "Watch DNA unwind and replicate. Understand base pairing rules (A-T, G-C) and the replication process.",
                        LabCategory.BIOLOGY, "Molecular Biology", "Medium",
                        "dna_replication", "https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500"),

                createLab("Cardiac Cycle Visualization",
                        "Observe the beating heart and understand the cardiac cycle. Adjust heart rate and see ECG patterns.",
                        LabCategory.BIOLOGY, "Human Physiology", "Medium",
                        "cardiac_cycle", "https://images.unsplash.com/photo-1559757172-0d8967c6bc75?w=500"),

                createLab("Ecosystem Dynamics",
                        "Simulate predator-prey relationships. Observe population dynamics and the balance of ecosystems.",
                        LabCategory.BIOLOGY, "Ecology", "Medium",
                        "ecosystem", "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=500"),

                // CS Labs
                createLab("Python Variables & Data Types",
                        "Learn the basics of Python programming. Practice declaring variables and working with strings, numbers, and lists.",
                        LabCategory.CS, "Python", "Easy",
                        "python_basics", "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=500"),

                createLab("Algorithm Visualizer",
                        "Watch sorting and searching algorithms in action. Compare bubble sort, merge sort, and binary search.",
                        LabCategory.CS, "Algorithms", "Medium",
                        "algorithms", "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500"),

                // Math Labs
                createLab("Function Graphing Calculator",
                        "Plot mathematical functions in real-time. Explore linear, quadratic, trigonometric, and exponential functions.",
                        LabCategory.MATH, "Algebra", "Easy",
                        "graphing", "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=500"),

                createLab("Geometry Construction Lab",
                        "Use virtual compass and straightedge to construct geometric shapes. Prove theorems interactively.",
                        LabCategory.MATH, "Geometry", "Medium",
                        "geometry", "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500"));

        labRepository.saveAll(labs);
    }

    private Lab createLab(String title, String description, LabCategory category,
            String subject, String difficulty, String content, String imageUrl) {
        Lab lab = new Lab();
        lab.setTitle(title);
        lab.setDescription(description);
        lab.setCategory(category);
        lab.setSubject(subject);
        lab.setDifficulty(difficulty);
        lab.setContent(content);
        lab.setImageUrl(imageUrl);
        return lab;
    }
}
