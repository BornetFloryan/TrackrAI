import org.bson.Document;
import java.net.*;
import java.net.http.*;
import java.net.http.HttpResponse.*;
import java.io.*;
import java.time.Duration;
import java.util.List;


public class HttpDataDriver implements DataDriver {

    private HttpClient client;
    private String apiURL;
    private String serviceSecret;

    public HttpDataDriver(String apiURL) {
        this.apiURL = apiURL;
        this.serviceSecret = System.getenv("SERVICE_SECRET");
        client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public boolean init() {
        return true;
    }

    private String checkError(Document answer) {
        int error = answer.getInteger("error");
        if (error != 0) {
            return answer.getString("data");
        }
        return null;
    }

    private Document postRequest(String route, String payload) {
        Document doc = null;
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(apiURL+route))
                .timeout(Duration.ofSeconds(10))
                .header("Content-Type", "application/json")
                .method("POST",HttpRequest.BodyPublishers.ofString(payload));

        if (serviceSecret != null && !serviceSecret.isBlank()) {
            builder.header("x-service-secret", serviceSecret);
        }

        HttpRequest request = builder.build();
        try {
            HttpResponse<String> response = client.send(request, BodyHandlers.ofString());
            System.out.println(response.body());
            // parse received JSON
            doc = Document.parse(response.body());
        }
        catch(InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
        catch(IOException e) {
            return null;
        }
        catch(RuntimeException e) {
            return null;
        }
        return doc;
    }

    public synchronized String autoRegisterModule(String uc, List<String> chipsets) {
        String payload = new Document("uc", uc)
                .append("chipsets", chipsets)
                .toJson();

        Document doc = postRequest("/module/register", payload);
        if (doc == null) {
            return "ERR cannot join the API";
        }
        // if error
        String err = checkError(doc);
        if (err != null) return err;
        // if not, get desired field in data
        Document data = (Document)doc.get("data");
        String name = data.getString("name");
        String shortName = data.getString("shortName");
        String key = data.getString("key");
        return "OK "+name+","+shortName+","+key;
    }

    public synchronized  String saveMeasure(String type, String date, String value, String moduleKey, String sessionId) {

        String payload = new Document("type", type)
                .append("date", date)
                .append("value", value)
                .append("moduleKey", moduleKey)
                .append("sessionId", sessionId)
                .toJson();

        return sendMeasure(payload);
    }

    public synchronized String saveAnalysis(String type, String date, String value, String analysisId) {

        String payload = new Document("type", type)
                .append("date", date)
                .append("value", value)
                .append("analysisId", analysisId)
                .toJson();
        return sendMeasure(payload);
    }

    private String sendMeasure(String payload) {
        Document doc = postRequest("/measure/create", payload);
        if (doc == null) {
            return "ERR cannot join the API";
        }
        String err = checkError(doc);
        if (err != null) return err;
        return "OK";
    }

    public synchronized boolean isSessionActive(String sessionId) {

        String payload = new Document("sessionId", sessionId).toJson();
        Document doc = postRequest("/session/active", payload);

        if (doc == null) return false;
        Document data = doc.get("data", Document.class);
        return doc.getInteger("error") == 0 && data != null && Boolean.TRUE.equals(data.getBoolean("active"));
    }

    public synchronized String moduleConnection(String moduleKey, boolean connected) {
        String payload = new Document("moduleKey", moduleKey)
                .append("connected", connected)
                .toJson();
    
        Document doc = postRequest("/module/connection", payload);
        if (doc == null) return "ERR cannot join the API";
    
        String err = checkError(doc);
        if (err != null) return "ERR " + err;
    
        return "OK";
    }          

}
