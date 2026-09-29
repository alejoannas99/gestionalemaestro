package gestionalemaestro.dto;

import gestionalemaestro.model.Client;

public record ClientDTO(
    Integer code,
    String name,
    String surname,
    String numTel,
    int lessonsAttended,
    Integer accountId
) {
    // lessonsAttended: le lezioni già svolte con l'istruttore, calcolate dalle lezioni (non più un contatore salvato)
    // accountId: l'account collegato a questa scheda (per mostrarne la foto), null se nessuno si è ancora collegato
    public static ClientDTO from(Client c, int lessonsAttended) {
        return new ClientDTO(
            c.getCode(),
            c.getName(),
            c.getSurname(),
            c.getNumTel().orElse(null),
            lessonsAttended,
            c.getAccounts().stream().findFirst().map(u -> u.getId()).orElse(null)
        );
    }
}
