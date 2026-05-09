package gestionalemaestro.dto;

import gestionalemaestro.model.Client;

public record ClientDTO(
    Integer code,
    String name,
    String surname,
    String numTel,
    int lessonsAttended
) {
    public static ClientDTO from(Client c) {
        return new ClientDTO(
            c.getCode(),
            c.getName(),
            c.getSurname(),
            c.getNumTel().orElse(null),
            c.getLessonsAttended()
        );
    }
}
