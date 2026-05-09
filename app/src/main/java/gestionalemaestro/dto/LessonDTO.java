package gestionalemaestro.dto;

import gestionalemaestro.model.Lesson;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record LessonDTO(
    int id,
    LocalDate date,
    LocalTime start,
    LocalTime finish,
    List<ClientDTO> clients
) {
    public static LessonDTO from(Lesson l) {
        return new LessonDTO(
            l.getId(),
            l.getDate(),
            l.getStart(),
            l.getFinish(),
            l.getClients().stream().map(ClientDTO::from).toList()
        );
    }
}