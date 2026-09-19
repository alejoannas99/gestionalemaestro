package gestionalemaestro.controller;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.dto.MyLessonDTO;
import gestionalemaestro.model.User;
import gestionalemaestro.service.LessonService;

@RestController
@RequestMapping("/me")
public class MeController {

    private final LessonService lessonService;

    public MeController(LessonService lessonService) {
        this.lessonService = lessonService;
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
}
