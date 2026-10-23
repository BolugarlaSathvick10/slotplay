package com.slotplay.config;

import com.slotplay.entity.Amenity;
import com.slotplay.entity.Role;
import com.slotplay.entity.Sport;
import com.slotplay.repository.AmenityRepository;
import com.slotplay.repository.RoleRepository;
import com.slotplay.repository.SportRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Order(1)
public class RoleInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RoleInitializer.class);

    private final RoleRepository roleRepository;
    private final SportRepository sportRepository;
    private final AmenityRepository amenityRepository;
    private final com.slotplay.repository.UserRepository userRepository;

    public RoleInitializer(RoleRepository roleRepository,
                           SportRepository sportRepository,
                           AmenityRepository amenityRepository,
                           com.slotplay.repository.UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.sportRepository = sportRepository;
        this.amenityRepository = amenityRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        ensureRole("user");
        ensureRole("owner");
        ensureRole("admin");

        ensureSport("Cricket", "/icons/cricket.svg");
        ensureSport("Football", "/icons/football.svg");
        ensureSport("Badminton", "/icons/badminton.svg");

        ensureAmenity("Floodlights", "Zap");
        ensureAmenity("Parking", "ParkingCircle");
        ensureAmenity("Changing Room", "ShowerHead");
        ensureAmenity("Drinking Water", "Droplets");
        ensureAmenity("WiFi", "Wifi");
        ensureAmenity("First Aid", "Shield");

        // Ensure all existing user accounts in the database are marked verified so they aren't blocked on login
        List<com.slotplay.entity.User> existingUsers = userRepository.findAll();
        for (com.slotplay.entity.User u : existingUsers) {
            if (!u.isVerified()) {
                u.setVerified(true);
                userRepository.save(u);
                log.info("[RoleInitializer] Auto-verified existing user: {}", u.getEmail());
            }
        }
    }

    private void ensureRole(String name) {
        if (roleRepository.findByName(name).isEmpty()) {
            Role role = new Role(name);
            roleRepository.save(role);
            log.info("[RoleInitializer] Created default role: {}", name);
        }
    }

    private void ensureSport(String name, String iconUrl) {
        if (sportRepository.findByName(name).isEmpty()) {
            Sport sport = new Sport(name, iconUrl);
            sportRepository.save(sport);
            log.info("[RoleInitializer] Created default sport: {}", name);
        }
    }

    private void ensureAmenity(String name, String icon) {
        if (amenityRepository.findByName(name).isEmpty()) {
            Amenity amenity = new Amenity(name, icon);
            amenityRepository.save(amenity);
            log.info("[RoleInitializer] Created default amenity: {}", name);
        }
    }
}
