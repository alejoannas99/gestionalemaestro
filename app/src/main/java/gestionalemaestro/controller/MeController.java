package gestionalemaestro.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.dto.MyLessonDTO;
import gestionalemaestro.model.User;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.LessonService;
import gestionalemaestro.service.LinkService;

@RestController
@RequestMapping("/me")
public class MeController {

    private final LessonService lessonService;
    private final LinkService linkService;

    public MeController(LessonService lessonService, LinkService linkService) {
        this.lessonService = lessonService;
        this.linkService = linkService;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping("/lezioni")
    public List<MyLessonDTO> getMyLezioni() {
        return lessonService.showLessonsOf(getLoggedUser())
            .stream()
            .map(MyLessonDTO::from)
            .toList();
    }

    @GetMapping("/riepilogo")
    public LessonService.Summary getMyRiepilogo() {
        return lessonService.summaryOf(getLoggedUser());
    }

    // Elenco degli istruttori tra cui scegliere per chiedere il collegamento
    @GetMapping("/istruttori")
    public List<LinkService.InstructorInfo> getIstruttori() {
        return linkService.instructors();
    }

    @GetMapping("/richieste")
    public List<LinkService.MyRequest> getMyRichieste() {
        return linkService.myRequests(getLoggedUser());
    }

    @PostMapping("/richieste")
    public ResponseEntity<String> newRichiesta(@RequestBody RichiestaRequest request) {
        try {
            linkService.request(getLoggedUser(), request.instructorId());
            return ResponseEntity.status(201).body("Richiesta inviata");
        } catch (DomainException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    record RichiestaRequest(Integer instructorId) {}
}
