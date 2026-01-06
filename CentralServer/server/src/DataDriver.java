import java.util.List;

public interface DataDriver {

    // initialize the driver (if needed)
    public boolean init();
    // store a measure in the DB
    public String saveMeasure(String type, String date, String value, String moduleKey, String sessionId);
    // store a measure in the DB but coming from the analysis server -> no module key
    public String saveAnalysis(String type, String date, String value, String analysisId);
    // register a module from its own request
    public String autoRegisterModule(String uc, List<String> chipsets);
    // === SESSION CHECK ===
    public boolean isSessionActive(String sessionId);
    public String moduleConnection(String moduleKey, boolean connected);
}
