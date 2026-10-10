package com.oai.androiduse;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

/** Owns ONLY a private Android VirtualDisplay. Exits and releases it after a 10-min lease. */
public final class DisplayEngine {
    private static Object virtualDisplay;
    private static Object imageReader;

    private static Object invoke(Object object, String name, Class<?>[] types, Object... args) throws Exception {
        Method m = object.getClass().getMethod(name, types);
        m.setAccessible(true);
        return m.invoke(object, args);
    }
    private static Object invokeStatic(Class<?> clazz, String name, Class<?>[] types, Object... args) throws Exception {
        Method m = clazz.getDeclaredMethod(name, types);
        m.setAccessible(true);
        return m.invoke(null, args);
    }
    private static int flag(Class<?> clazz, String name) throws Exception {
        Field f = clazz.getDeclaredField(name);
        f.setAccessible(true);
        return f.getInt(null);
    }
    private static void cleanup() {
        try {
            if (virtualDisplay != null) invoke(virtualDisplay, "release", new Class<?>[0]);
        } catch (Exception ignored) {}
        try {
            if (imageReader != null) invoke(imageReader, "close", new Class<?>[0]);
        } catch (Exception ignored) {}
        virtualDisplay = null;
        imageReader = null;
    }

    public static void main(String[] args) {
        try {
            invokeStatic(Class.forName("android.os.Looper"), "prepareMainLooper", new Class<?>[0]);
            Object thread = invokeStatic(Class.forName("android.app.ActivityThread"), "systemMain", new Class<?>[0]);
            Object context = invoke(thread, "getSystemContext", new Class<?>[0]);
            Object manager = invoke(context, "getSystemService", new Class<?>[]{String.class}, "display");
            if (manager == null) throw new IllegalStateException("DisplayManager unavailable");
            Class<?> dm = Class.forName("android.hardware.display.DisplayManager");
            int flags = 0;
            for (String name : new String[]{
                    "VIRTUAL_DISPLAY_FLAG_PUBLIC",
                    "VIRTUAL_DISPLAY_FLAG_PRESENTATION",
                    "VIRTUAL_DISPLAY_FLAG_OWN_CONTENT_ONLY",
                    "VIRTUAL_DISPLAY_FLAG_DESTROY_CONTENT_ON_REMOVAL",
                    "VIRTUAL_DISPLAY_FLAG_SUPPORTS_TOUCH",
                    "VIRTUAL_DISPLAY_FLAG_TRUSTED",
                    "VIRTUAL_DISPLAY_FLAG_OWN_DISPLAY_GROUP",
                    "VIRTUAL_DISPLAY_FLAG_ALWAYS_UNLOCKED",
                    "VIRTUAL_DISPLAY_FLAG_OWN_FOCUS",
                    "VIRTUAL_DISPLAY_FLAG_STEAL_TOP_FOCUS_DISABLED"}) {
                flags |= flag(dm, name);
            }
            Class<?> ir = Class.forName("android.media.ImageReader");
            imageReader = invokeStatic(ir, "newInstance", new Class<?>[]{int.class,int.class,int.class,int.class},
                    720,1280,1,2);
            Object surface = invoke(imageReader,"getSurface",new Class<?>[0]);
            Class<?> surfaceType = Class.forName("android.view.Surface");
            virtualDisplay = invoke(manager, "createVirtualDisplay", new Class<?>[]{
                    String.class,int.class,int.class,int.class,surfaceType,int.class},
                    "AndroidUseCore",720,1280,320,surface,flags);
            if (virtualDisplay == null) throw new IllegalStateException("VirtualDisplay unavailable");
            Object display = invoke(virtualDisplay,"getDisplay",new Class<?>[0]);
            int id = (Integer)invoke(display,"getDisplayId",new Class<?>[0]);
            int actualFlags = (Integer)invoke(display,"getFlags",new Class<?>[0]);
            if (id <= 0) throw new IllegalStateException("Virtual display ID invalid");
            System.out.println("CREATED " + id + " " + actualFlags);
            System.out.flush();
            Runtime.getRuntime().addShutdownHook(new Thread(DisplayEngine::cleanup));
            Thread.sleep(600000L);
        } catch (Throwable ex) {
            System.err.println("DISPLAY_ENGINE_ERROR " + ex.getClass().getName() + ": " + ex.getMessage());
            ex.printStackTrace(System.err);
        } finally {cleanup();}
    }
}
