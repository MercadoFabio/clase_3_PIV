package ar.edu.utn.tup.pagos;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;

// Microservicio independiente de pagos.
// Corre en su propio contenedor Docker y escucha en el puerto 8082.
// El BFF lo consulta directamente por la red interna de Docker Compose.
@SpringBootApplication
public class PagosApplication {

	private static final Logger log = LoggerFactory.getLogger(PagosApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(PagosApplication.class, args);
	}

	// Un pago asociado a un pedido.
	public record Pago(int id, int pedidoId, double monto, String estado) {
	}

	// Endpoint de pagos. El BFF lo consulta en /api/pagos y en /api/inicio
	// (fan-out paralelo junto con pedidos-service:8081).
	@RestController
	public static class PagosController {

		@GetMapping("/pagos")
		public List<Pago> pagos(HttpServletRequest request) {
			log.info("💳 [pagos-service :8082] GET /pagos solicitado por {} -> Despachando 3 pagos",
					request.getRemoteAddr());
			return List.of(
					new Pago(101, 1, 18000.0, "PAGADO"),
					new Pago(102, 2, 12500.0, "PENDIENTE"),
					new Pago(103, 3, 22000.0, "PENDIENTE"));
		}
	}

}
