package gestionalemaestro.model;

public final class NameUtil {

    private NameUtil() {}

    // "  Mario   Rossi " -> "Mario Rossi": toglie gli spazi ai bordi e riduce quelli doppi
    public static String normalize(String s) {
        return s == null ? null : s.trim().replaceAll("\\s+", " ");
    }
}
