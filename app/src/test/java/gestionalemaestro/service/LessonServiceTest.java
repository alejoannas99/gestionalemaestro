package gestionalemaestro.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.store.FakeStore;
import gestionalemaestro.store.LessonRepository;

import java.util.List;
import java.util.ArrayList;

public class LessonServiceTest {

    private void resetStore() {
        FakeStore.lessons.clear();
    }

    private Client createClient(String code, String name, String surname) {
        return new Client(code, name, surname);
    }

    @Test
    void testNewLesson() {
        resetStore();
        LessonRepository repo = new LessonRepository();
        LessonService service = new LessonService(repo);

        List<Client> clients = new ArrayList<>();
        clients.add(createClient("1", "Mario", "Rossi"));

        service.newLesson("10:00", "2026-04-01", "11:00", clients);

        List<Lesson> lessons = service.showLessons();
        assertEquals(1, lessons.size());
        Lesson l = lessons.get(0);
        assertEquals("10:00", l.getStart());
        assertEquals("11:00", l.getFinish());
        assertEquals(1, l.getClients().size());
        assertEquals("Mario", l.getClients().get(0).getName());

        // Verifica che il client abbia incrementato le lezioni
        assertEquals(1, l.getClients().get(0).getLessonsAttended());
    }

    @Test
    void testNewLessonThrowsOnNoClients() {
        resetStore();
        LessonRepository repo = new LessonRepository();
        LessonService service = new LessonService(repo);

        Exception e = assertThrows(RuntimeException.class, () -> {
            service.newLesson("10:00", "2026-04-01", "11:00", new ArrayList<>());
        });
        assertTrue(e.getMessage().contains("At least one client"));
    }

    @Test
    void testRemoveLesson() {
        resetStore();
        LessonRepository repo = new LessonRepository();
        LessonService service = new LessonService(repo);

        List<Client> clients = new ArrayList<>();
        clients.add(createClient("1", "Mario", "Rossi"));

        service.newLesson("10:00", "2026-04-01", "11:00", clients);
        assertEquals(1, service.amountOfLessons());

        Lesson l = service.showLessons().get(0);
        service.removeLesson(l.getId());
        assertEquals(0, service.amountOfLessons());
    }

    @Test
    void testModifyLesson() {
        resetStore();
        LessonRepository repo = new LessonRepository();
        LessonService service = new LessonService(repo);

        List<Client> clients = new ArrayList<>();
        clients.add(createClient("1", "Mario", "Rossi"));

        service.newLesson("10:00", "2026-04-01", "11:00", clients);
        Lesson l = service.showLessons().get(0);

        // Modifica: nuova ora e nuovo client
        List<Client> newClients = new ArrayList<>();
        newClients.add(createClient("2", "Luca", "Bianchi"));

        service.modifyLesson(l, "2026-04-01", "12:00", "13:00", newClients);
        Lesson modified = service.showLessons().get(0);

        assertEquals("12:00", modified.getStart());
        assertEquals("13:00", modified.getFinish());
        assertEquals(1, modified.getClients().size());
        assertEquals("Luca", modified.getClients().get(0).getName());
    }
}
