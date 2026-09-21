package gestionalemaestro.dto;

import gestionalemaestro.model.Lesson;
import gestionalemaestro.model.Location;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record LessonDTO(
    int id,
    LocalDate date,
    LocalTime start,
    LocalTime finish,
    List<ClientSummaryDTO> clients,
    String locationName,
    Double latitude,
    Double longitude
) {
    public static LessonDTO from(Lesson l) {
        Location loc = l.getLocation();
        return new LessonDTO(
            l.getId(),
            l.getDate(),
            l.getStart(),
            l.getFinish(),
            l.getClients().stream().map(ClientSummaryDTO::from).toList(),
            loc != null ? loc.getName() : null,
            loc != null ? loc.getLatitude() : null,
            loc != null ? loc.getLongitude() : null
        );
    }
}