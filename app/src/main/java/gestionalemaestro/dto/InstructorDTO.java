package gestionalemaestro.dto;

import gestionalemaestro.model.Instructor;

public record InstructorDTO(
    Integer id,
    String name,
    String surname
) {
    public static InstructorDTO from(Instructor i) {
        return new InstructorDTO(
            i.getId(),
            i.getName(),
            i.getSurname()
        );
    }
}
