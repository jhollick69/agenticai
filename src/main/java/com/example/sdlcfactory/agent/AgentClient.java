package com.example.sdlcfactory.agent;

import com.example.sdlcfactory.config.FactoryProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Single Anthropic Messages API call wrapped in a tool-use loop.
 *
 * Sends the request, executes any tool_use blocks via {@link Tools}, appends results,
 * and re-sends until the model stops calling tools or {@code maxToolTurns} is reached.
 * Returns the concatenated final text.
 */
@Component
public class AgentClient {

    private static final Logger log = LoggerFactory.getLogger(AgentClient.class);
    private static final ObjectMapper M = new ObjectMapper();

    private final RestClient client;
    private final FactoryProperties props;

    public AgentClient(RestClient anthropicRestClient, FactoryProperties props) {
        this.client = anthropicRestClient;
        this.props = props;
    }

    public record Result(String text, int turns, boolean exhausted) {}

    public Result run(String systemPrompt, String userMessage, Tools tools, int maxToolTurns) {
        ArrayNode messages = M.createArrayNode();
        messages.add(userMessage(userMessage));

        StringBuilder finalText = new StringBuilder();
        int turn = 0;

        while (turn < maxToolTurns) {
            turn++;
            ObjectNode req = buildRequest(systemPrompt, messages, tools);
            JsonNode resp = call(req);
            String stopReason = resp.path("stop_reason").asText("");
            JsonNode content = resp.path("content");

            // Capture any text blocks; collect tool_use blocks for execution.
            ArrayNode toolResults = M.createArrayNode();
            boolean hasToolUse = false;
            for (JsonNode block : content) {
                String type = block.path("type").asText();
                if ("text".equals(type)) {
                    finalText.append(block.path("text").asText()).append("\n");
                } else if ("tool_use".equals(type)) {
                    hasToolUse = true;
                    String id = block.path("id").asText();
                    String name = block.path("name").asText();
                    JsonNode input = block.path("input");
                    String result;
                    try {
                        result = tools.invoke(name, input);
                    } catch (Exception e) {
                        result = "{\"error\":\"" + e.getMessage() + "\"}";
                    }
                    ObjectNode tr = M.createObjectNode();
                    tr.put("type", "tool_result");
                    tr.put("tool_use_id", id);
                    tr.put("content", result);
                    toolResults.add(tr);
                }
            }

            // Append the assistant turn (must include the tool_use blocks verbatim).
            messages.add(assistantMessage(content));

            if (!hasToolUse || "end_turn".equals(stopReason) || "stop_sequence".equals(stopReason)) {
                return new Result(finalText.toString().trim(), turn, false);
            }

            // Append tool results as the next user turn.
            ObjectNode userTurn = M.createObjectNode();
            userTurn.put("role", "user");
            userTurn.set("content", toolResults);
            messages.add(userTurn);
        }

        log.warn("AgentClient exhausted {} tool turns", maxToolTurns);
        return new Result(finalText.toString().trim(), turn, true);
    }

    private ObjectNode buildRequest(String system, ArrayNode messages, Tools tools) {
        ObjectNode req = M.createObjectNode();
        req.put("model", props.model());
        req.put("max_tokens", props.maxTokens());
        if (system != null && !system.isBlank()) {
            req.put("system", system);
        }
        req.set("messages", messages);
        if (tools != null) {
            ArrayNode arr = M.valueToTree(tools.schemas());
            req.set("tools", arr);
        }
        return req;
    }

    private JsonNode call(ObjectNode req) {
        return client.post()
                .uri("/v1/messages")
                .body(req)
                .retrieve()
                .body(JsonNode.class);
    }

    private ObjectNode userMessage(String text) {
        ObjectNode m = M.createObjectNode();
        m.put("role", "user");
        ArrayNode content = M.createArrayNode();
        ObjectNode block = M.createObjectNode();
        block.put("type", "text");
        block.put("text", text);
        content.add(block);
        m.set("content", content);
        return m;
    }

    private ObjectNode assistantMessage(JsonNode contentBlocks) {
        ObjectNode m = M.createObjectNode();
        m.put("role", "assistant");
        m.set("content", contentBlocks);
        return m;
    }
}
