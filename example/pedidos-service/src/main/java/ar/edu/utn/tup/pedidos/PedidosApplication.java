package ar.edu.utn.tup.pedidos;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

// Microservicio independiente de pedidos.
// Corre en su propio contenedor Docker y escucha en el puerto 8081.
// El BFF lo consulta directamente por la red interna de Docker Compose.
@SpringBootApplication
public class PedidosApplication {

	private static final Logger log = LoggerFactory.getLogger(PedidosApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(PedidosApplication.class, args);
	}

	// Un pedido de la pizzeria. Un record alcanza: Spring lo serializa a JSON solo.
	public record Pedido(int id, String pizza, int cantidad) {
	}

	// Endpoint de pedidos. El BFF lo consulta en /api/pedidos y en /api/inicio
	// (fan-out paralelo junto con pagos-service:8082).
	@RestController
	public static class PedidosController {

		@GetMapping("/pedidos")
		public List<Pedido> pedidos(HttpServletRequest request) {
			log.info("🍕 [pedidos-service :8081] GET /pedidos solicitado por {} -> Despachando 3 pedidos",
					request.getRemoteAddr());
			return List.of(
					new Pedido(1, "Muzzarella", 2),
					new Pedido(2, "Napolitana", 1),
					new Pedido(3, "Fugazzeta", 3));
		}
	}

}
