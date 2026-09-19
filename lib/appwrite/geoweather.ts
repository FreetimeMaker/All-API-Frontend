import { Account, Client, Functions, OAuthProvider, Query, TablesDB } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "6aad93080001aa8fad42";

export const GEO_WEATHER_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_GEOWEATHER_DATABASE_ID || "geoweather";
export const GEO_WEATHER_SUBSCRIPTIONS_TABLE =
  process.env.NEXT_PUBLIC_APPWRITE_GEOWEATHER_SUBSCRIPTIONS_TABLE || "geoweather_subscriptions";
export const GEO_WEATHER_REDEEM_FUNCTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_GEOWEATHER_REDEEM_FUNCTION_ID || "redeem-geoweather-code";

export const appwriteClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const appwriteAccount = new Account(appwriteClient);
export const appwriteTables = new TablesDB(appwriteClient);
export const appwriteFunctions = new Functions(appwriteClient);

export async function getGeoWeatherSubscription(userId: string) {
  const result = await appwriteTables.listRows({
    databaseId: GEO_WEATHER_DATABASE_ID,
    tableId: GEO_WEATHER_SUBSCRIPTIONS_TABLE,
    queries: [
      Query.equal("user_id", userId),
      Query.equal("is_active", true),
      Query.limit(25),
    ],
  });

  return result.rows.at(-1)?.data?.type?.toString() || "free";
}

export function signInGeoWeatherWithOAuth(provider: "github" | "gitlab") {
  const origin = window.location.origin;
  appwriteAccount.createOAuth2Session({
    provider: provider === "github" ? OAuthProvider.Github : OAuthProvider.Gitlab,
    success: `${origin}/geoweather`,
    failure: `${origin}/geoweather/login?error=oauth`,
  });
}
