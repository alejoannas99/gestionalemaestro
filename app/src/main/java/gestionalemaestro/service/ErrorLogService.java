package gestionalemaestro.service;

import java.time.LocalDateTime;
import java.util.Deque;
import java.util.List;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.springframework.stereotype.Service;

// Le eccezioni impreviste (bug veri, non errori di dominio come "email già registrata" che
// i controller gestiscono già da soli) oggi spariscono nel terminale, invisibili a meno di
// essere lì a guardare in quel momento. Le tiene in memoria per il pannello admin: si azzera
// ad ogni riavvio del backend, ma va bene così, serve solo a non perdere gli ultimi imprevisti.
@Service
public class ErrorLogService {

    private static final int MAX = 50;

    public record ErrorEntry(LocalDateTime quando, String metodo, String percorso, String tipo, String messaggio) {}

    private final Deque<ErrorEntry> recenti = new ConcurrentLinkedDeque<>();

    public void registra(String metodo, String percorso, Throwable e) {
        recenti.addFirst(new ErrorEntry(LocalDateTime.now(), metodo, percorso,
            e.getClass().getSimpleName(), e.getMessage()));
        while (recenti.size() > MAX) {
            recenti.removeLast();
        }
    }

    public List<ErrorEntry> recenti() {
        return List.copyOf(recenti);
    }
}
