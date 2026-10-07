import {Logger} from '@ambreia/common/utils/Logger';
import {VortexLoadingScreen} from './VortexLoadingScreen';
import {VortexApp} from './App';
import {installBugReporter} from './BugReporter';

const log = Logger.getLogger('client.index');

// Before the app, deliberately: the reporter wraps console.error and listens for unhandled
// rejections, and a boot failure is exactly the report worth having. Installed later, the client
// could only report what happened after it managed to start.
installBugReporter();

const loadingScreen = new VortexLoadingScreen();
const app = new VortexApp(loadingScreen);

/**
 * AS3: HabboAir.as::formatLoadingErrorMessage() — three buckets, chosen off the message text and a
 * numeric stage code. The port has no stage code, so it matches on the text alone; the AS3 codes it
 * also tested (7/8 for game data, 2/5 for libraries) name the same two cases.
 */
function formatLoadingErrorMessage(error: unknown): string
{
    const text = String((error as {message?: unknown} | null)?.message ?? error ?? '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();

    if(text.includes('gamedata') || text.includes('product data') || text.includes('localization'))
    {
        return 'Failed to download required game data.\nPlease check your connection and restart the client.';
    }

    if(text.includes('download') || text.includes('assetbundle'))
    {
        return 'Failed to download required client libraries.\nPlease check your connection and restart the client.';
    }

    return 'Client startup failed.\nPlease restart the client.';
}

/**
 * AS3: HabboAir.as::showLoadingError() — a boot failure has to reach the screen. Logging alone left
 * the fake progress bar cycling forever, which reads exactly like a slow load.
 */
app.init().catch((error) =>
{
    log.error('Failed to initialize application:', error);

    if(!loadingScreen.disposed) loadingScreen.showError(formatLoadingErrorMessage(error));
});
