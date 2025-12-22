import java.io.*;
import java.net.*;

class MainServer  {

    ServerSocket conn;
    Socket sock;
    int port;
    DataExchanger exchanger;
    int idThread;
	String apiUrl;
	String mongoUr;

    public MainServer(int port) throws IOException {
        this.port = port;
        conn = new ServerSocket(port,1);
        idThread = 1;
		apiUrl = System.getenv().getOrDefault(
    		"TRACKR_API_URL",
    		"http://localhost:4567/trackrapi"
		);
		mongoUrl = System.getenv().getOrDefault(
			"MONGO_URL",
			"mongodb://localhost:27017"
		);
		exchanger = new DataExchanger(apiUrl, mongoUrl);
        // need to initializae mongo driver
        if (!exchanger.getMongoDriver().init()) {
            throw new IOException("cannot reach mongodb server and/or trackrapi database");
        }
    }

    public void mainLoop() throws IOException {

        while(true) {
            sock = conn.accept();
            System.out.println("new client connected, thread id = "+ idThread);
            ThreadServer t = new ThreadServer(idThread++, sock, exchanger);
            t.start();
        }
    }
}

		
