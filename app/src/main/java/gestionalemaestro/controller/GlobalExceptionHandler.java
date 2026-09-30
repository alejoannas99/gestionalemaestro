package gestionalemaestro.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import gestionalemaestro.service.ErrorLogService;

// Cattura solo le eccezioni davvero impreviste: ogni controller gestisce già DomainException
// da solo con il codice HTTP giusto (400/404/409...), quindi qui arriva solo quello che nessuno
// si aspettava (NullPointerException, un problema del database, ecc.) — bug veri. Li registra
// per il pannello admin e risponde con un messaggio generico: i dettagli non vanno mostrati a
// chi ha fatto la richiesta, solo a chi amministra l'app.
@RestControllerAdvice
public class GlobalExceptionHandler {

    private final ErrorLogService errorLogService;

    public GlobalExceptionHandler(ErrorLogService errorLogService) {
        this.errorLogService = errorLogService;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleUnexpected(Exception e, HttpServletRequest request) {
        errorLogService.registra(request.getMethod(), request.getRequestURI(), e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Errore interno del server");
    }
}
