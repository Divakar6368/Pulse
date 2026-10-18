import { logger } from "better-auth";
import chalk from "chalk";
import yoctoSpinner from "yocto-spinner";


export async function pollForToken(
      authClient,
      deviceCode,
      clientId,
      initialIntervalue,
    ) {
      let pollingInterval = initialIntervalue;
      const spinner = yoctoSpinner({ text: "", color: "cyan" });

      let dots = 0;

      return new Promise((resolve, reject) => {
        const poll = async () => {
          dots = (dots + 1) % 4;
          spinner.text = chalk.gray(
            `Polling for authorization${".".repeat(dots)}${" ".repeat(3 - dots)}`,
          );
          if (!spinner.isSpinning) spinner.start();

          try {
            const { data, error } = await authClient.device.token({
              grant_type: "urn:ietf:params:oauth:grant-type:device_code",
              device_code: deviceCode,
              client_id: clientId,
              fetchOptions: {
                headers: {
                  "user-agent": `My CLI`,
                },
              },
            });

            if (data?.access_token) {
              console.log(
                chalk.bold.yellow(`Your acess token: ${data.access_token}`),
              );
              spinner.stop();
              resolve(data);
              return;
            } else if (error) {
              switch (error.error) {
                case "authorization_pending":
                  // Continue polling
                  break;
                case "slow_down":
                  pollingInterval += 5;
                  break;
                case "access_denied":
                  console.error("Access was denied by the user");
                  return;
                case "expired_token":
                  console.error(
                    "The device code has expired. Please try again.",
                  );
                  return;
                default:
                  spinner.stop();
                  logger.error(`Error: ${error.error_description}`);
                  process.exit(1);
              }
            }
          } catch (error) {
            spinner.stop();
            logger.error(`Network error: ${err.message}`);
            process.exit(1);
          }

          setTimeout(poll, pollingInterval * 1000);
        };
        
      setTimeout(poll , pollingInterval * 1000);
      });
}