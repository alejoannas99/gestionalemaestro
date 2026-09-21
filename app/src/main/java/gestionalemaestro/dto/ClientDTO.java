package gestionalemaestro.dto;

import gestionalemaestro.model.Client;

public record ClientDTO(
    Integer code,
    String name,
    String surname,
    String numTel,
    int lessonsAttended
) {
    // lessonsAttended: le lezioni già svolte con l'istruttore, calcolate dalle lezioni (non più un contatore salvato)
    public static ClientDTO from(Client c, int lessonsAttended) {
        return new ClientDTO(
            c.getCode(),
            c.getName(),
            c.getSurname(),
            c.getNumTel().orElse(null),
            lessonsAttended
        );
    }
}
