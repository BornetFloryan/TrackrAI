import org.bson.types.ObjectId;

import java.io.*;
import java.net.*;
import java.util.ArrayList;
import java.util.List;

class ThreadServer extends Thread {

	BufferedReader br;
	PrintStream ps;
	Socket sock;
	DataExchanger exchanger;
	int idThread;

	boolean sessionActive = false;
	String currentSessionId = null;

	public ThreadServer(int idThread, Socket sock, DataExchanger data) {
		this.sock = sock;
		this.idThread = idThread;
		this.exchanger = data;
	}

	public void run() {

		try {
			br = new BufferedReader(new InputStreamReader(sock.getInputStream()));
			ps = new PrintStream(sock.getOutputStream());
		}
		catch(IOException e) {
			System.err.println("Thread "+ idThread +": cannot create streams. Aborting.");
			return;
		}
		requestLoop();
		System.out.println("end of thread "+ idThread);
	}

	public void requestLoop() {

		String req = "";
		String idReq;
		String[] reqParts;

		try {
			while(true) {
				req = br.readLine();
				if ((req == null) || (req.isEmpty())) {
					break;
				}

				reqParts = req.split(" ");
				idReq = reqParts[0];

				if ("AUTOREGISTER".equals(idReq)) {
					requestAutoRegister(reqParts);
				}
				else if ("STOREMEASURE".equals(idReq)) {
					requestStoreMeasure(reqParts);
				}
				else if ("STOREANALYSIS".equals(idReq)) {
					requestStoreAnalysis(reqParts);
				}
				else if ("START_SESSION".equals(idReq)) {
					requestStartSession(reqParts);
				}
				else if ("STOP_SESSION".equals(idReq)) {
					requestStopSession();
				} else {
					ps.println("ERR unknown command");
				}
			}
			System.out.println("end of request loop");
		}
		catch(IOException e) {
			System.out.println("problem with receiving request: "+e.getMessage());
		}
		finally {
			sessionActive = false;
			currentSessionId = null;
		}
	}

	protected void requestAutoRegister(String[] params) throws IOException {
		// remove the identifier+uc from params
		List<String> lst = new ArrayList<>();
		for(int i=2;i<params.length;i++) {
			lst.add(params[i]);
		}
		System.out.println("processing request AUTO REGISTER");
		if (params.length < 3) {
			ps.println("ERR invalid number of parameters");
			return;
		}
		// (un)comment to choose direct mongo access or through the node API
		//String answer = exchanger.getMongoDriver().autoRegisterModule(params[1], lst);
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
		//String answer = exchanger.getMongoDriver().saveMeasure(params[1], params[2], params[3], params[4]);
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
		//String answer = exchanger.getHttpDriver().saveAnalysis(params[1], params[2], params[3]);
		System.out.println(answer);
		ps.println(answer);
	}

	protected void requestStartSession(String[] params) throws IOException {

		if (params.length != 2) {
			ps.println("ERR invalid parameters");
			return;
		}

		currentSessionId = params[1];
		sessionActive = true;

		System.out.println(
				"Thread " + idThread + " -> session started: " + currentSessionId
		);

		ps.println("OK");
	}

	protected void requestStopSession() throws IOException {

		sessionActive = false;
		currentSessionId = null;

		System.out.println(
				"Thread " + idThread + " -> session stopped"
		);

		ps.println("OK");
	}
}

		
