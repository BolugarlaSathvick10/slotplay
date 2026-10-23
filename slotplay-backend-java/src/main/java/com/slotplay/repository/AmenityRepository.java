package com.slotplay.repository;

import com.slotplay.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, Integer> {

    List<Amenity> findAllByOrderByNameAsc();

    Optional<Amenity> findByName(String name);
}
