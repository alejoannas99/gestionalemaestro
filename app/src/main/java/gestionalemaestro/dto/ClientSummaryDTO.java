package gestionalemaestro.dto;

import gestionalemaestro.model.Client;

// Il cliente com'è mostrato dentro una lezione: solo l'essenziale (niente telefono né contatori)
public record ClientSummaryDTO(
    Integer code,
    String name,
    String surname
) {
    public static ClientSummaryDTO from(Client c) {
        return new ClientSummaryDTO(c.getCode(), c.getName(), c.getSurname());
    }
}
