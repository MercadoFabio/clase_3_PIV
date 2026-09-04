package ar.edu.utn.tup.backend;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

// Todo el backend en un solo archivo, a proposito: la idea de este ejemplo es
// la infraestructura (Nginx + Docker), no la arquitectura del backend.
@SpringBootApplication
public class BackendApplication {

	private static final Logger log = LoggerFactory.getLogger(BackendApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	// Un pedido de la pizzeria. Un record alcanza: Spring lo serializa a JSON solo.
	public record Pedido(int id, String pizza, int cantidad) {
	}

	// Un pago asociado a un pedido.
	public record Pago(int id, int pedidoId, double monto, String estado) {
	}

	// Endpoint de pedidos: el BFF o Nginx lo consultan en la red interna de Docker.
	@RestController
	public static class PedidosController {

		@GetMapping("/pedidos")
		public List<Pedido> pedidos(HttpServletRequest request) {
			log.info("🍕 [BACKEND :8080] GET /pedidos solicitado por {} -> Despachando 3 pedidos", request.getRemoteAddr());
			return List.of(
					new Pedido(1, "Muzzarella", 2),
					new Pedido(2, "Napolitana", 1),
					new Pedido(3, "Fugazzeta", 3));
		}
	}

	// Endpoint de pagos: el BFF lo consultara junto con /pedidos para armar la
	// pantalla consolidada en /api/inicio.
	@RestController
	public static class PagosController {

		@GetMapping("/pagos")
		public List<Pago> pagos(HttpServletRequest request) {
			log.info("💳 [BACKEND :8080] GET /pagos solicitado por {} -> Despachando 3 pagos", request.getRemoteAddr());
			return List.of(
					new Pago(101, 1, 18000.0, "PAGADO"),
					new Pago(102, 2, 12500.0, "PENDIENTE"),
					new Pago(103, 3, 22000.0, "PENDIENTE"));
		}
	}

}
