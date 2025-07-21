import { Context, Effect, Layer, pipe } from 'effect';
import { user } from '../db/auth-schema';
import { db as database } from '../db';
import { eq } from 'drizzle-orm';

type User = typeof user.$inferSelect;

export class UserNotFoundError extends Error {
	constructor(userId: string) {
		super(`User with ID ${userId} not found`);
		this.name = 'UserNotFoundError';
	}
}

type DatabaseService = {
	getUser: (userId: string) => Effect.Effect<User, UserNotFoundError>;
	createUser: (userData: User) => Effect.Effect<User, Error>;
	deleteUser: (userId: string) => Effect.Effect<void, Error>;
};

export class UserService extends Context.Tag('UserService')<UserService, DatabaseService>() {
	static live = Layer.effect(
		this,
		Effect.gen(function* () {
			return {
				getUser: (userId: string) =>
					pipe(
						Effect.tryPromise({
							try: () =>
								database.query.user.findFirst({ where: (user, { eq }) => eq(user.id, userId) }),
							catch: () => new UserNotFoundError(userId)
						}),
						Effect.flatMap((user) => {
							return user ? Effect.succeed(user) : Effect.fail(new UserNotFoundError(userId));
						})
					),
				createUser: (userData: User) =>
					Effect.tryPromise({
						try: () =>
							database
								.insert(user)
								.values(userData)
								.returning()
								.then((result) => result[0]),
						catch: (error) => new Error(`Failed to create user: ${error}`)
					}),
				deleteUser: (userId: string) =>
					Effect.tryPromise({
						try: () =>
							database
								.delete(user)
								.where(eq(user.id, userId))
								.then(() => void 0),
						catch: (error) => new Error(`Failed to delete user: ${error}`)
					})
			};
		})
	);
}
