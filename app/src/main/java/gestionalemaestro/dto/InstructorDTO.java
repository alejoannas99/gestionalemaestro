package gestionalemaestro.dto;

import gestionalemaestro.model.User;

public record InstructorDTO(
    Integer id,
    String name,
    String surname
) {
    public static InstructorDTO from(User i) {
        return new InstructorDTO(
            i.getId(),
            i.getName(),
            i.getSurname()
        );
    }
}
