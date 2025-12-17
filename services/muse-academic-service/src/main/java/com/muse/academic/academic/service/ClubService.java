package com.muse.academic.academic.service;

import com.muse.academic.academic.entity.Club;
import com.muse.academic.academic.entity.ClubEvent;
import com.muse.academic.academic.entity.ClubMember;
import com.muse.academic.academic.entity.ClubPost;
import com.muse.academic.academic.repository.ClubEventRepository;
import com.muse.academic.academic.repository.ClubMemberRepository;
import com.muse.academic.academic.repository.ClubPostRepository;
import com.muse.academic.academic.repository.ClubRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClubService {

    private final ClubRepository clubRepository;
    private final ClubMemberRepository clubMemberRepository;
    private final ClubPostRepository clubPostRepository;
    private final ClubEventRepository clubEventRepository;

    // ========== Club CRUD ==========

    public List<Club> getAllClubs() {
        return clubRepository.findAll();
    }

    public List<Club> getClubsByCategory(String category) {
        return clubRepository.findByCategoryOrderByMemberCountDesc(category);
    }

    public List<Club> searchClubs(String query) {
        return clubRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query);
    }

    public Optional<Club> getClubById(Long id) {
        return clubRepository.findById(id);
    }

    @Transactional
    public Club createClub(String name, String description, String category, String imageUrl,
            Boolean isPrivate, Long creatorId, Long institutionId) {
        Club club = Club.builder()
                .name(name)
                .description(description)
                .category(category)
                .imageUrl(imageUrl)
                .isPrivate(isPrivate != null ? isPrivate : false)
                .memberCount(1)
                .creatorId(creatorId)
                .institutionId(institutionId)
                .build();

        Club savedClub = clubRepository.save(club);

        // Add creator as admin member
        ClubMember member = ClubMember.builder()
                .club(savedClub)
                .userId(creatorId)
                .role("ADMIN")
                .build();
        clubMemberRepository.save(member);

        return savedClub;
    }

    @Transactional
    public Club updateClub(Long clubId, String name, String description, String category,
            String imageUrl, Boolean isPrivate) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        if (name != null)
            club.setName(name);
        if (description != null)
            club.setDescription(description);
        if (category != null)
            club.setCategory(category);
        if (imageUrl != null)
            club.setImageUrl(imageUrl);
        if (isPrivate != null)
            club.setIsPrivate(isPrivate);

        return clubRepository.save(club);
    }

    @Transactional
    public void deleteClub(Long clubId) {
        clubRepository.deleteById(clubId);
    }

    // ========== Membership ==========

    public List<ClubMember> getClubMembers(Long clubId) {
        return clubMemberRepository.findByClubId(clubId);
    }

    public List<Club> getClubsByUser(Long userId) {
        List<ClubMember> memberships = clubMemberRepository.findByUserId(userId);
        return memberships.stream()
                .map(ClubMember::getClub)
                .toList();
    }

    public boolean isMember(Long clubId, Long userId) {
        return clubMemberRepository.findByClubIdAndUserId(clubId, userId).isPresent();
    }

    @Transactional
    public ClubMember joinClub(Long clubId, Long userId) {
        if (isMember(clubId, userId)) {
            throw new RuntimeException("Already a member");
        }

        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        ClubMember member = ClubMember.builder()
                .club(club)
                .userId(userId)
                .role("MEMBER")
                .build();

        club.setMemberCount(club.getMemberCount() + 1);
        clubRepository.save(club);

        return clubMemberRepository.save(member);
    }

    @Transactional
    public void leaveClub(Long clubId, Long userId) {
        ClubMember member = clubMemberRepository.findByClubIdAndUserId(clubId, userId)
                .orElseThrow(() -> new RuntimeException("Not a member"));

        if ("ADMIN".equals(member.getRole())) {
            long adminCount = clubMemberRepository.findByClubId(clubId).stream()
                    .filter(m -> "ADMIN".equals(m.getRole()))
                    .count();
            if (adminCount <= 1) {
                throw new RuntimeException("Cannot leave: you are the only admin");
            }
        }

        Club club = member.getClub();
        club.setMemberCount(Math.max(0, club.getMemberCount() - 1));
        clubRepository.save(club);

        clubMemberRepository.delete(member);
    }

    // ========== Posts ==========

    public List<ClubPost> getClubPosts(Long clubId) {
        return clubPostRepository.findByClubIdOrderByIsPinnedDescCreatedAtDesc(clubId);
    }

    @Transactional
    public ClubPost createPost(Long clubId, Long authorId, String authorName, String content,
            String imageUrl, Boolean isAnnouncement) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        ClubPost post = ClubPost.builder()
                .club(club)
                .authorId(authorId)
                .authorName(authorName)
                .content(content)
                .imageUrl(imageUrl)
                .isAnnouncement(isAnnouncement != null ? isAnnouncement : false)
                .build();

        return clubPostRepository.save(post);
    }

    @Transactional
    public void deletePost(Long postId) {
        clubPostRepository.deleteById(postId);
    }

    @Transactional
    public ClubPost togglePinPost(Long postId) {
        ClubPost post = clubPostRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        post.setIsPinned(!post.getIsPinned());
        return clubPostRepository.save(post);
    }

    // ========== Events ==========

    public List<ClubEvent> getClubEvents(Long clubId, boolean upcomingOnly) {
        if (upcomingOnly) {
            return clubEventRepository.findUpcomingByClubId(clubId, java.time.LocalDateTime.now());
        }
        return clubEventRepository.findByClubIdOrderByEventDateAsc(clubId);
    }

    @Transactional
    public ClubEvent createEvent(Long clubId, Long creatorId, String title, String description,
            java.time.LocalDateTime eventDate, String location,
            String meetingLink, String eventType) {
        Club club = clubRepository.findById(clubId)
                .orElseThrow(() -> new RuntimeException("Club not found"));

        ClubEvent event = ClubEvent.builder()
                .club(club)
                .title(title)
                .description(description)
                .eventDate(eventDate)
                .location(location)
                .meetingLink(meetingLink)
                .eventType(eventType != null ? eventType : "MEETING")
                .creatorId(creatorId)
                .build();

        return clubEventRepository.save(event);
    }

    @Transactional
    public void deleteEvent(Long eventId) {
        clubEventRepository.deleteById(eventId);
    }

    @Transactional
    public ClubEvent rsvpEvent(Long eventId) {
        ClubEvent event = clubEventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        event.setRsvpCount(event.getRsvpCount() + 1);
        return clubEventRepository.save(event);
    }
}
