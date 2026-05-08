package gestionalemaestro.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import gestionalemaestro.model.Instructor;
import gestionalemaestro.store.JpaInstructorRepository;

@Service
public class InstructorService {

    private final JpaInstructorRepository instructorRepository;
    private final PasswordEncoder passwordEncoder;

    public InstructorService(JpaInstructorRepository instructorRepository, PasswordEncoder passwordEncoder) {
        this.instructorRepository = instructorRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Instructor register(String email, String password, String name, String surname) {
        if (instructorRepository.findByEmail(email).isPresent()) {
            throw new DomainException("Email già registrata");
        }
        Instructor instructor = new Instructor(email, passwordEncoder.encode(password), name, surname);
        return instructorRepository.save(instructor);
    }

    public Instructor findByEmail(String email) {
        return instructorRepository.findByEmail(email)
            .orElseThrow(() -> new DomainException("Instructor non trovato"));
    }
}