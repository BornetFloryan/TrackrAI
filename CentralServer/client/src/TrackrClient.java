import java.io.*;

class TrackrClient {

  public static void main(String []args) {

    MainClient client;

    if (args.length != 2) {
      System.out.println("usage: java TrackrClient ip_server port");
      System.exit(1);
    }

    try {
      String serverAddr = args[0];
      int port = Integer.parseInt(args[1]);
      client = new MainClient(serverAddr,port);
      client.mainLoop();
    }
    catch(IOException e) {
      System.out.println("cannot connect to server : "+e.getMessage());
      System.exit(1);
    }
  }
}
		
