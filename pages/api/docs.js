// pages/api/docs.js
export default function handler(req, res) {
  res.status(200).json({
    info: {
      title: "Code Deployment API",
      description: "API for deploying Python and JavaScript code",
      version: "1.0.0"
    },
    endpoints: [
      {
        path: "/api/deploy",
        method: "POST",
        description: "Deploy code to the platform",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    description: "Source code to deploy (Python or JavaScript)"
                  }
                },
                required: ["code"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Successful deployment",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    liveUrl: {
                      type: "string",
                      description: "URL where the deployed code is accessible"
                    },
                    language: {
                      type: "string",
                      description: "Detected language (Python or JavaScript)"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Bad request - Missing or invalid parameters"
          },
          "500": {
            description: "Server error during deployment"
          }
        }
      }
    ]
  });
}