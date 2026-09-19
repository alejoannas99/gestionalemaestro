package gestionalemaestro.dto;

import gestionalemaestro.model.Lesson;
import java.time.LocalDate;
import java.time.LocalTime;

// Vista di una lezione per il cliente: niente dati degli altri partecipanti
public record MyLessonDTO(
    int id,
    LocalDate date,
    LocalTime start,
    LocalTime finish,
    String instructorName,
    String instructorSurname
) {
    public static MyLessonDTO from(Lesson l) {
        return new MyLessonDTO(
            l.getId(),
            l.getDate(),
            l.getStart(),
            l.getFinish(),
            l.getInstructor().getName(),
            l.getInstructor().getSurname()
        );
    }
}
