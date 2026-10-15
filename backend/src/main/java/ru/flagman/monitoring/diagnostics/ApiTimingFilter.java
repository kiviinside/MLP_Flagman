package ru.flagman.monitoring.diagnostics;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/** Logs API server-side duration without recording credentials, query strings, or request bodies. */
@Component
public class ApiTimingFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(ApiTimingFilter.class);
    private static final Pattern SAFE_REQUEST_ID = Pattern.compile("[A-Za-z0-9._-]{1,80}");
    private static final long SLOW_REQUEST_MS = 1000L;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        long startedAt = System.nanoTime();
        String requestId = request.getHeader("X-Request-Id");
        if (requestId == null || !SAFE_REQUEST_ID.matcher(requestId).matches()) {
            requestId = UUID.randomUUID().toString();
        }
        response.setHeader("X-Request-Id", requestId);

        int status = HttpServletResponse.SC_INTERNAL_SERVER_ERROR;
        String outcome = "completed";
        try {
            filterChain.doFilter(request, response);
            status = response.getStatus();
        } catch (IOException | ServletException | RuntimeException ex) {
            outcome = "exception=" + ex.getClass().getSimpleName();
            throw ex;
        } finally {
            long durationMs = (System.nanoTime() - startedAt) / 1_000_000L;
            String path = request.getRequestURI(); // Deliberately excludes query parameters.
            if (durationMs >= SLOW_REQUEST_MS || status >= 500 || !"completed".equals(outcome)) {
                log.warn("HTTP_METRIC request_id={} method={} path={} status={} duration_ms={} outcome={}",
                        requestId, request.getMethod(), path, status, durationMs, outcome);
            } else {
                log.info("HTTP_METRIC request_id={} method={} path={} status={} duration_ms={} outcome={}",
                        requestId, request.getMethod(), path, status, durationMs, outcome);
            }
        }
    }
}
