package netflix.nebula.interactive
;

import io.netty.buffer.ByteBuf;
import io.reactivex.netty.protocol.http.server.HttpServerRequest;
import io.reactivex.netty.protocol.http.server.HttpServerResponse;
import io.reactivex.netty.protocol.http.server.RequestHandler;

import java.io.InputStream;
import java.util.Scanner;

public class ClassPathFileRequestHandler implements RequestHandler<ByteBuf, ByteBuf> {
    private final String prefix;

    public ClassPathFileRequestHandler(String prefix) {
        this.prefix = prefix;
    }

    @Override
    public rx.Observable<Void> handle(HttpServerRequest<ByteBuf> request, HttpServerResponse<ByteBuf> response) {
        InputStream stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(prefix + request.getUri());
        try(Scanner s = new Scanner(stream)) {
            String fileText = s.useDelimiter("\\A").hasNext() ? s.next() : "";
            response.writeString(fileText);
            return response.close();
        }
    }
}
