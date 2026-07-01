export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Instant API Generator",
    description: 
      "Documentation for your generated API.\n\n" +
      "**Authentication:**\n" +
      "- Use the `admin_key` for full access (Create, Update, Delete).\n" +
      "- Use the `read_key` for read-only access (Get).",
    version: "1.0.0",
  },
  servers: [
    {
      url: "/",
      description: "Current server",
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "apiKey",
        in: "query", // Changed to 'query' as it's easier for users (?apiKey=...)
        name: "apiKey", // Matching your code usage
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/api/data/{table}": {
      get: {
        summary: "Retrieve all records",
        description: "Requires Read Key or Admin Key",
        parameters: [
          {
            name: "table",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", default: 100 },
          },
          {
            name: "offset",
            in: "query",
            schema: { type: "integer", default: 0 },
          }
        ],
        responses: {
          200: { description: "List of records" },
        },
      },
      post: {
        summary: "Create a record",
        description: "**Requires Admin Key**",
        parameters: [
          {
            name: "table",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          201: { description: "Record created" },
          403: { description: "Forbidden: Read-only key used" }
        },
      },
    },
    "/api/data/{table}/{id}": {
      get: {
        summary: "Get record by ID",
        parameters: [
          { name: "table", in: "path", required: true },
          { name: "id", in: "path", required: true },
        ],
        responses: {
          200: { description: "Single record" },
          404: { description: "Not found" },
        },
      },
      put: {
        summary: "Update record",
        description: "**Requires Admin Key**",
        parameters: [
          { name: "table", in: "path", required: true },
          { name: "id", in: "path", required: true },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object" },
            },
          },
        },
        responses: {
          200: { description: "Updated record" },
        },
      },
      delete: {
        summary: "Delete record",
        description: "**Requires Admin Key**",
        parameters: [
          { name: "table", in: "path", required: true },
          { name: "id", in: "path", required: true },
        ],
        responses: {
          200: { description: "Deleted" },
        },
      },
    },
  },
};