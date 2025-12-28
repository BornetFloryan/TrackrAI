import java.io.*;
import java.net.*;
import java.util.ArrayList;
import java.util.List;

class ThreadServer extends Thread {

    private static final int SOCKET_TIMEOUT_MS = 15000;

    BufferedReader br;
    PrintStream ps;
    Socket sock;
    DataExchanger exchanger;
    int idThread;

    // === SESSION STATE ===
    boolean sessionActive = false;
    String currentSessionId = null;

    String moduleKey = null;


    public ThreadServer(int idThread, Socket sock, DataExchanger data) {
        this.sock = sock;
        this.idThread = idThread;
        this.exchanger = data;
    }

    public void run() {

        try {
            sock.setSoTimeout(SOCKET_TIMEOUT_MS);

            br = new BufferedReader(new InputStreamReader(sock.getInputStream()));
            ps = new PrintStream(sock.getOutputStream());
        } catch (IOException e) {
            System.err.println("Thread " + idThread + ": cannot create streams. Aborting.");
            return;
        }

        requestLoop();
        System.out.println("end of thread " + idThread);
    }

	private void cleanup() {
		System.out.println("Thread " + idThread + " cleanup");

		if (moduleKey != null) {
			MainServer.modules.remove(moduleKey);

			try {
				exchanger.getHttpDriver().moduleConnection(moduleKey, false);
			} catch (Exception e) {
				System.err.println("Failed to update module connection=false on API");
			}

			System.out.println("Module disconnected: " + moduleKey);
		}

		sessionActive = false;
		currentSessionId = null;

		try { sock.close(); } catch (Exception ignored) {}
	}

	public void requestLoop() {

		String req;
		String idReq;
		String[] reqParts;

		try {
			while (true) {

				try {
					req = br.readLine();
				}
				catch (SocketTimeoutException te) {

					if (sessionActive) {
						System.out.println(
								"Thread " + idThread +
										" -> socket timeout during ACTIVE session, closing connection"
						);
						break;
					}

					// pas de session → on continue à attendre
					continue;
				}

				if (req == null) {
					System.out.println("Thread " + idThread + " -> socket closed by client");
					break;
				}

				if (req.isEmpty()) {
					continue;
				}

				reqParts = req.split(" ");
				idReq = reqParts[0];

				switch (idReq) {
					case "AUTOREGISTER" -> requestAutoRegister(reqParts);
					case "STOREMEASURE" -> requestStoreMeasure(reqParts);
					case "STOREANALYSIS" -> requestStoreAnalysis(reqParts);
					case "START_SESSION" -> requestStartSession(reqParts);
					case "STOP_SESSION" -> requestStopSession();
					case "HELLO" -> requestHello(reqParts);
					case "START_SESSION_FOR_MODULE" -> requestStartSessionForModule(reqParts);
					case "STOP_SESSION_FOR_MODULE" -> requestStopSessionForModule(reqParts);
					case "FORCE_DISCONNECT_MODULE" -> requestForceDisconnect(reqParts);
					default -> ps.println("ERR unknown command");
				}
			}
		}
		catch (IOException e) {
			System.out.println("problem with receiving request: " + e.getMessage());
		}
		finally {
			cleanup();
		}
	}

    public void forceDisconnect(String reason) {
        System.out.println("Force disconnect thread " + idThread + ": " + reason);
        try {
            sock.close();
        } catch (Exception ignored) {
        }
    }

    protected void requestAutoRegister(String[] params) throws IOException {

        // remove the identifier+uc from params
        List<String> lst = new ArrayList<>();
        for (int i = 2; i < params.length; i++) {
            lst.add(params[i]);
        }

        System.out.println("processing request AUTO REGISTER");

        if (params.length < 3) {
            ps.println("ERR invalid number of parameters");
            return;
        }

        // (un)comment to choose direct mongo access or through the node API
        // String answer = exchanger.getMongoDriver().autoRegisterModule(params[1], lst);
        String answer = exchanger.getHttpDriver().autoRegisterModule(params[1], lst);

        System.out.println(answer);
        ps.println(answer);
    }

    protected void requestStoreMeasure(String[] params) throws IOException {

        if (!sessionActive || currentSessionId == null) {
            ps.println("ERR no active session");
            return;
        }

        if (params.length != 5) {
            ps.println("ERR invalid number of parameters");
            return;
        }

        System.out.println(
                "processing STOREMEASURE in session " + currentSessionId
        );

        // (un)comment to choose direct mongo access or through the node API
        // String answer = exchanger.getMongoDriver().saveMeasure(params[1], params[2], params[3], params[4]);
        String answer = exchanger.getHttpDriver()
                .saveMeasure(params[1], params[2], params[3], params[4], currentSessionId);

        System.out.println(answer);
        ps.println(answer);
    }

    protected void requestStoreAnalysis(String[] params) throws IOException {

        System.out.println("processing request STORE ANALYSIS");

        if (params.length != 4) {
            ps.println("ERR invalid number of parameters");
            return;
        }

        // (un)comment to choose direct mongo access or through the node API
        String answer = exchanger.getMongoDriver().saveAnalysis(params[1], params[2], params[3]);
        // String answer = exchanger.getHttpDriver().saveAnalysis(params[1], params[2], params[3]);

        System.out.println(answer);
        ps.println(answer);
    }

    protected void requestStartSession(String[] params) throws IOException {

        if (params.length != 2) {
            ps.println("ERR invalid parameters");
            return;
        }

        // refuse if already active
        if (sessionActive) {
            ps.println("ERR session already active");
            return;
        }

        String sessionId = params[1];

        // validate session with API
        boolean ok = exchanger.getHttpDriver().isSessionActive(sessionId);
        if (!ok) {
            ps.println("ERR invalid or inactive session");
            return;
        }

        currentSessionId = sessionId;
        sessionActive = true;

        System.out.println(
                "Thread " + idThread + " -> session started: " + currentSessionId
        );

        ps.println("OK");
    }

    protected void requestStopSession() throws IOException {

        // idempotent: OK even if already stopped
        sessionActive = false;
        currentSessionId = null;

        System.out.println(
                "Thread " + idThread + " -> session stopped"
        );

        ps.println("OK");
    }

    protected void requestHello(String[] params) throws IOException {

        if (params.length != 2) {
            ps.println("ERR invalid parameters");
            return;
        }

        moduleKey = params[1];

        ThreadServer previous = MainServer.modules.get(moduleKey);
        if (previous != null && previous != this) {
            System.out.println("Replacing existing connection for module " + moduleKey);
            previous.forceDisconnect("Replaced by new connection");
        }

        MainServer.modules.put(moduleKey, this);

        System.out.println(
                "Thread " + idThread + " -> HELLO from module " + moduleKey
        );

        exchanger.getHttpDriver().moduleConnection(moduleKey, true);

        ps.println("OK");
    }

    protected void requestStartSessionForModule(String[] params) throws IOException {
        if (params.length != 3) {
            ps.println("ERR invalid parameters");
            return;
        }

        String targetModuleKey = params[1];
        String sessionId = params[2];

        ThreadServer target = MainServer.modules.get(targetModuleKey);
        if (target == null) {
            ps.println("ERR module not connected");
            return;
        }

        boolean ok = exchanger.getHttpDriver().isSessionActive(sessionId);
        if (!ok) {
            ps.println("ERR invalid or inactive session");
            return;
        }

        target.currentSessionId = sessionId;
        target.sessionActive = true;

        target.ps.println("START_SESSION " + sessionId);
        target.ps.flush();

        ps.println("OK");
    }

    protected void requestStopSessionForModule(String[] params) throws IOException {

        if (params.length != 2) {
            ps.println("ERR invalid parameters");
            return;
        }

        String targetModuleKey = params[1];

        ThreadServer target = MainServer.modules.get(targetModuleKey);
        if (target == null) {
            ps.println("ERR module not connected");
            return;
        }

        target.sessionActive = false;
        target.currentSessionId = null;

        target.ps.println("STOP_SESSION");
        target.ps.flush();

        ps.println("OK");
    }

    protected void requestForceDisconnect(String[] params) throws IOException {
        if (params.length != 2) {
            ps.println("ERR invalid parameters");
            return;
        }

        String targetModuleKey = params[1];
        ThreadServer target = MainServer.modules.get(targetModuleKey);

        if (target == null) {
            ps.println("OK"); // déjà déconnecté → idempotent
            return;
        }

        target.forceDisconnect("Forced by API watchdog");
        ps.println("OK");
    }

}
