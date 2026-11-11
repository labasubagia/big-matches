import { Button } from "./ui/button";

// Inline, recoverable fixture-load failure. Keeps a load error out of the
// router's dead-end error boundary so a transient/persistent fetch failure
// never bricks a route into the opaque "Something went wrong!" screen.
export function LoadError({
	message,
	onRetry,
}: {
	message?: string;
	onRetry: () => void;
}) {
	return (
		<section
			className="mt-6 rounded-lg border border-border p-4 text-sm"
			role="alert"
			aria-live="polite"
		>
			<p className="font-medium">Couldn't load match data.</p>
			{message ? <p className="mt-1 text-muted-foreground">{message}</p> : null}
			<Button
				onClick={onRetry}
				variant="outline"
				size="sm"
				className="mt-3 cursor-pointer"
			>
				Retry
			</Button>
		</section>
	);
}
